import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Truck,
  Church,
  Heart,
  Check,
} from "lucide-react";
import { useDemo } from "../../contexts/demo";
import { donationsApi } from "../../services/api/donations";
import { today, dayLabel } from "../../utils/dates";
import {
  Button,
  PageHead,
  Field,
  ErrorMessage,
  Empty,
} from "../../components/index";
import PhotoPreview from "../../components/PhotoPreview";

const newItem = (cat) => ({
  key: crypto.randomUUID(),
  categoria_id: cat?.id || "",
  descricao: "",
  quantidade: 1,
  condicao: cat?.slug === "alimentos" ? "NOVO" : "BOM_ESTADO",
  validade: "",
});
export default function NewDonation() {
  const { churches, campaigns, categories, donor, reload, notify } = useDemo();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [churchId, setChurchId] = useState(
    Number(params.get("igreja")) || churches[0]?.id || 0,
  );
  const church = churches.find((c) => c.id === churchId);
  const [campaignId, setCampaignId] = useState(params.get("campanha") || "");
  const [items, setItems] = useState(() => [
    newItem(
      church?.categorias.find(
        (category) =>
          category.id ===
          campaigns.find(
            (campaign) =>
              campaign.id === Number(params.get("campanha")) &&
              campaign.igreja_id === churchId,
          )?.categoria_id,
      ) || church?.categorias[0],
    ),
  ]);
  const [mode, setMode] = useState("ENTREGA"),
    [address, setAddress] = useState("Rua de Exemplo, 10 — endereço fictício");
  const [step, setStep] = useState(1),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);
  const active = campaigns.filter((c) => c.igreja_id === churchId && c.ativa);
  function update(key, field, value) {
    setItems(
      items.map((i) =>
        i.key === key
          ? {
              ...i,
              [field]: value,
              ...(field === "categoria_id" &&
              categories.find((c) => c.id === Number(value))?.slug ===
                "alimentos"
                ? { condicao: "NOVO" }
                : {}),
            }
          : i,
      ),
    );
  }
  function changeChurch(value) {
    const c = churches.find((c) => c.id === Number(value));
    setChurchId(c.id);
    setCampaignId("");
    setMode("ENTREGA");
    setItems(
      items.map((i) => {
        const category =
          c.categorias.find((cat) => cat.id === i.categoria_id) ||
          c.categorias[0];
        return {
          ...i,
          categoria_id: category?.id || "",
          condicao: category?.slug === "alimentos" ? "NOVO" : i.condicao,
        };
      }),
    );
    setError("");
  }
  function review(e) {
    e.preventDefault();
    setError("");
    if (!church?.categorias.length) {
      setError(
        "Esta igreja precisa configurar as categorias aceitas antes de receber doações.",
      );
      return;
    }
    for (const i of items) {
      const cat = categories.find((c) => c.id === Number(i.categoria_id));
      if (!i.descricao.trim()) {
        setError("Descreva todos os itens.");
        return;
      }
      if (cat?.slug === "alimentos" && (!i.validade || i.validade < today())) {
        setError("Informe uma validade a partir de hoje para cada alimento.");
        return;
      }
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function save() {
    setBusy(true);
    setError("");
    try {
      const donation = await donationsApi.create({
        doador_demo_id: donor.id,
        igreja_id: churchId,
        campanha_id: campaignId ? Number(campaignId) : null,
        modalidade: mode,
        endereco_coleta_ficticio: mode === "COLETA" ? address : null,
        itens: items.map(
          ({ categoria_id, descricao, quantidade, condicao, validade }) => ({
            categoria_id: Number(categoria_id),
            descricao,
            quantidade: Number(quantidade),
            condicao,
            validade: validade || null,
          }),
        ),
      });
      setCreated(donation.id);
      await reload();
      notify("Doação enviada! Fotos são ilustrativas e não foram armazenadas.");
      navigate(`/doador/doacoes/${donation.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (created)
    return (
      <div className="card padded">
        <h1>Doação DOA-{created} salva!</h1>
        <p>
          Seu registro foi persistido. Se a atualização falhou, tente recarregar
          os dados.
        </p>
        <ErrorMessage>{error}</ErrorMessage>
        <Button
          onClick={async () => {
            try {
              await reload();
              navigate(`/doador/doacoes/${created}`);
            } catch (e) {
              setError(e.message);
            }
          }}
        >
          Atualizar e acompanhar
        </Button>
      </div>
    );
  if (!church)
    return (
      <Empty
        title="Escolha uma igreja disponível"
        action={<Button to="/igrejas">Explorar igrejas</Button>}
      />
    );
  return (
    <>
      <PageHead
        eyebrow="UM NOVO DESTINO COMEÇA AQUI"
        title="Vamos fazer uma doação?"
        description="Conte o que você quer compartilhar. A igreja vai analisar os itens antes de combinar o recebimento."
        action={
          <span className="step-pill">
            ETAPA {step} DE 2 · {step === 1 ? "INFORMAÇÕES" : "REVISÃO"}
          </span>
        }
      />
      <div className="form-progress">
        <span className="active">1. Sua doação</span>
        <i />
        <span className={step === 2 ? "active" : ""}>2. Revisar e enviar</span>
      </div>
      <ErrorMessage>{error}</ErrorMessage>
      <form onSubmit={review} className="donation-form">
        <div className="card form-card">
          <div hidden={step !== 1}>
            <h2>Um pouco sobre o seu gesto</h2>
            <p className="form-intro">
              Todos os campos com * são obrigatórios. Use apenas dados
              fictícios.
            </p>
            <Field label="Igreja destinatária *">
              <select
                value={churchId}
                onChange={(e) => changeChurch(e.target.value)}
              >
                {churches.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Direcionar para uma campanha">
              <select
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
              >
                <option value="">Doação direta à igreja</option>
                {active.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.titulo}
                  </option>
                ))}
              </select>
            </Field>
            <div className="section-head">
              <h3>O que você vai doar?</h3>
              <span className="micro">{items.length} de 30 itens</span>
            </div>
            {items.map((item, index) => {
              const food =
                categories.find((c) => c.id === Number(item.categoria_id))
                  ?.slug === "alimentos";
              return (
                <fieldset className="item-fieldset" key={item.key}>
                  <legend>Item {String(index + 1).padStart(2, "0")}</legend>
                  <div className="item-top">
                    <strong>Informações do item</strong>
                    {items.length > 1 && (
                      <button
                        type="button"
                        className="danger-link"
                        aria-label={`Remover item ${index + 1}`}
                        onClick={() =>
                          setItems(items.filter((i) => i.key !== item.key))
                        }
                      >
                        <Trash2 size={16} />
                        Remover
                      </button>
                    )}
                  </div>
                  <div className="form-grid">
                    <Field label="Categoria *">
                      <select
                        required
                        value={item.categoria_id}
                        onChange={(e) =>
                          update(
                            item.key,
                            "categoria_id",
                            Number(e.target.value),
                          )
                        }
                      >
                        <option value="" disabled>
                          Selecione
                        </option>
                        {church.categorias.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nome}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Quantidade *">
                      <input
                        type="number"
                        min="1"
                        max="10000"
                        step="1"
                        required
                        value={item.quantidade}
                        onChange={(e) =>
                          update(item.key, "quantidade", e.target.value)
                        }
                      />
                    </Field>
                    <Field label="Descrição *" className="span-two">
                      <input
                        required
                        maxLength={500}
                        placeholder="Ex.: camisetas infantis limpas e sem avarias"
                        value={item.descricao}
                        onChange={(e) =>
                          update(item.key, "descricao", e.target.value)
                        }
                      />
                    </Field>
                    <Field label="Condição *">
                      <select
                        value={food ? "NOVO" : item.condicao}
                        onChange={(e) =>
                          update(item.key, "condicao", e.target.value)
                        }
                      >
                        <option value="NOVO">Novo / lacrado</option>
                        {!food && (
                          <option value="BOM_ESTADO">Bom estado</option>
                        )}
                      </select>
                    </Field>
                    {food && (
                      <Field
                        label="Validade do alimento *"
                        hint="Apenas não perecíveis, lacrados e dentro da validade."
                      >
                        <input
                          type="date"
                          required
                          min={today()}
                          value={item.validade}
                          onChange={(e) =>
                            update(item.key, "validade", e.target.value)
                          }
                        />
                      </Field>
                    )}
                  </div>
                </fieldset>
              );
            })}
            <Button
              type="button"
              variant="secondary"
              disabled={items.length >= 30}
              onClick={() =>
                setItems([...items, newItem(church.categorias[0])])
              }
            >
              <Plus size={17} />
              Adicionar outro item
            </Button>
            <PhotoPreview />
          </div>
          {step === 2 && (
            <section className="review">
              <span className="icon-tile">
                <Check />
              </span>
              <h2>Está tudo certo para compartilhar?</h2>
              <p>
                Revise antes de enviar para <strong>{church.nome}</strong>.
              </p>
              {campaignId && (
                <p>
                  Campanha:{" "}
                  {active.find((c) => c.id === Number(campaignId))?.titulo ||
                    "Campanha indisponível"}
                </p>
              )}
              <div className="review-items">
                {items.map((i, n) => (
                  <div key={i.key}>
                    <span className="eyebrow">
                      ITEM {n + 1} ·{" "}
                      {
                        categories.find((c) => c.id === Number(i.categoria_id))
                          ?.nome
                      }
                    </span>
                    <h3>
                      {i.quantidade} × {i.descricao}
                    </h3>
                    <p>
                      {i.condicao === "NOVO" ? "Novo / lacrado" : "Bom estado"}
                      {i.validade ? ` · Validade: ${dayLabel(i.validade)}` : ""}
                    </p>
                  </div>
                ))}
              </div>
              <div className="notice">
                <Heart size={20} />
                <p>
                  A doação começará como Pendente. As fotos são apenas uma
                  prévia e não serão enviadas ou armazenadas.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setStep(1);
                  setError("");
                }}
              >
                <ArrowLeft size={17} />
                Revisar informações
              </Button>
            </section>
          )}
        </div>
        <aside className="card form-card delivery-card">
          <h2>Como vamos conectar?</h2>
          <p className="form-intro">
            A modalidade depende da disponibilidade da igreja.
          </p>
          {step === 1 ? (
            <>
              <label
                className={`delivery-option ${mode === "ENTREGA" ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="delivery"
                  value="ENTREGA"
                  checked={mode === "ENTREGA"}
                  onChange={() => setMode("ENTREGA")}
                />
                <Church size={22} />
                <span>
                  <strong>Entrega presencial</strong>
                  <small>Você leva os itens à igreja na data combinada.</small>
                </span>
              </label>
              {church.oferece_coleta ? (
                <label
                  className={`delivery-option ${mode === "COLETA" ? "selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="delivery"
                    value="COLETA"
                    checked={mode === "COLETA"}
                    onChange={() => setMode("COLETA")}
                  />
                  <Truck size={22} />
                  <span>
                    <strong>Coleta pela igreja</strong>
                    <small>{church.condicoes_coleta}</small>
                  </span>
                </label>
              ) : (
                <p className="notice">
                  Esta igreja não oferece coleta. A doação será entregue
                  presencialmente.
                </p>
              )}
              {mode === "COLETA" && (
                <Field
                  label="Endereço fictício de retirada *"
                  hint="Não informe um endereço real: não há autenticação nesta demo."
                >
                  <textarea
                    required
                    maxLength={300}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </Field>
              )}
            </>
          ) : (
            <>
              <h3>
                {mode === "COLETA"
                  ? "Coleta pela igreja"
                  : "Entrega presencial"}
              </h3>
              <p>
                {mode === "COLETA" ? address : church.endereco_publico_ficticio}
              </p>
              <span className="badge muted">Endereço fictício</span>
            </>
          )}
          <div className="delivery-bottom">
            <p className="micro">
              O DoaES não realiza transporte. O agendamento é definido pela
              igreja após aceitar a doação.
            </p>
            {step === 1 ? (
              <Button type="submit" className="full">
                Revisar doação
                <ArrowRight size={17} />
              </Button>
            ) : (
              <Button
                type="button"
                className="full"
                disabled={busy}
                onClick={save}
              >
                {busy ? "Enviando…" : "Enviar minha doação"}
                <Heart size={17} />
              </Button>
            )}
            <Link className="cancel-link" to="/igrejas">
              Continuar explorando
            </Link>
          </div>
        </aside>
      </form>
    </>
  );
}
