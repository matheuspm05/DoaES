import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Megaphone } from "lucide-react";
import { useDemo } from "../../contexts/demo";
import { campaignsApi } from "../../services/api/campaigns";
import {
  PageHead,
  Button,
  Empty,
  Field,
  ErrorMessage,
} from "../../components/index";

export function CampaignEditor() {
  const { id } = useParams();
  const { campaigns, church, reload, notify } = useDemo();
  const navigate = useNavigate();
  const existing = id
    ? campaigns.find((c) => c.id === Number(id) && c.igreja_id === church.id)
    : null;
  const [form, setForm] = useState(
    existing || { titulo: "", descricao: "", categoria_id: "", ativa: true },
  );
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [created, setCreated] = useState(null);
  const update = (k, v) => setForm({ ...form, [k]: v });
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = {
        igreja_id: church.id,
        titulo: form.titulo,
        descricao: form.descricao,
        categoria_id: form.categoria_id ? Number(form.categoria_id) : null,
        ativa: form.ativa,
      };
      const result =
        created || existing
          ? await campaignsApi.update(created || id, body)
          : await campaignsApi.create(body);
      setCreated(result.id);
      await reload();
      notify("Campanha salva! As mudanças já estão nas páginas públicas.");
      navigate("/igreja/campanhas");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (id && !existing)
    return (
      <Empty
        title="Campanha não encontrada nesta igreja"
        action={<Button to="/igreja/campanhas">Voltar às campanhas</Button>}
      />
    );
  return (
    <>
      <Link className="back-link" to="/igreja/campanhas">
        <ArrowLeft size={16} />
        Voltar às campanhas
      </Link>
      <PageHead
        eyebrow="CAMPANHA FICTÍCIA"
        title={
          existing
            ? "Cuidar também é renovar."
            : "Uma nova campanha, muitas possibilidades."
        }
        description={`Campanha de demonstração para ${church.nome}.`}
      />
      <form className="card form-card campaign-editor" onSubmit={save}>
        <span className="icon-tile">
          <Megaphone />
        </span>
        <h2>{existing ? "Editar campanha" : "Criar campanha"}</h2>
        <ErrorMessage>{error}</ErrorMessage>
        <Field label="Título da campanha *">
          <input
            required
            maxLength={120}
            value={form.titulo}
            onChange={(e) => update("titulo", e.target.value)}
            placeholder="Ex.: Um gesto de cuidado"
          />
        </Field>
        <Field label="Descrição *">
          <textarea
            required
            maxLength={2000}
            rows={5}
            value={form.descricao}
            onChange={(e) => update("descricao", e.target.value)}
            placeholder="Explique quais itens esta campanha fictícia precisa receber."
          />
        </Field>
        <Field label="Categoria em destaque">
          <select
            value={form.categoria_id || ""}
            onChange={(e) => update("categoria_id", e.target.value)}
          >
            <option value="">Todas as categorias aceitas</option>
            {church.categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Situação">
          <select
            value={String(form.ativa)}
            onChange={(e) => update("ativa", e.target.value === "true")}
          >
            <option value="true">Ativa — recebe novas doações</option>
            <option value="false">Encerrada — disponível no histórico</option>
          </select>
        </Field>
        <div className="notice">
          <p>
            Encerrar uma campanha preserva as doações recebidas. Para encerrar,
            selecione “Encerrada” e salve.
          </p>
        </div>
        <div className="form-actions">
          <Button type="submit" disabled={busy}>
            <Save size={17} />
            {busy ? "Salvando…" : "Salvar campanha"}
          </Button>
          <Button to="/igreja/campanhas" variant="secondary">
            Cancelar
          </Button>
        </div>
      </form>
    </>
  );
}
