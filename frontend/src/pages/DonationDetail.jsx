import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  CalendarDays,
  Truck,
  Church,
  Heart,
  ImageOff,
} from "lucide-react";
import { useDemo } from "../contexts/demo";
import { api, dayLabel, periods, today, statuses } from "../services/api";
import {
  Button,
  PageHead,
  StatusBadge,
  Field,
  ErrorMessage,
  Empty,
  CategoryIcon,
} from "../components/ui";

export default function DonationDetail({
  churchMode = false,
  scheduling = false,
}) {
  const { id } = useParams();
  const { donations, church, donor, reload, notify } = useDemo();
  const navigate = useNavigate();
  const donation = donations.find(
    (d) =>
      d.id === Number(id) &&
      (churchMode ? d.igreja_id === church.id : d.doador_demo_id === donor.id),
  );
  const [reason, setReason] = useState(""),
    [refusing, setRefusing] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [data, setData] = useState(donation?.agendamento?.data || ""),
    [period, setPeriod] = useState(donation?.agendamento?.periodo || "MANHA"),
    [notes, setNotes] = useState(donation?.agendamento?.observacoes || "");
  async function action(path, body, message) {
    setBusy(true);
    setError("");
    try {
      await api(`/doacoes/${donation.id}/${path}`, { method: "PATCH", body });
      await reload();
      notify(message);
      if (path === "decisao" && body.status === "ACEITA")
        navigate(`/igreja/solicitacoes/${donation.id}/agendar`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (!donation)
    return (
      <Empty
        title="Doação não encontrada neste perfil"
        description="Selecione o doador ou a igreja destinatária corretos na barra de demonstração."
        action={
          <Button
            to={churchMode ? "/igreja/solicitacoes" : "/doador/historico"}
          >
            Voltar à lista
          </Button>
        }
      />
    );
  const d = donation;
  const steps = ["PENDENTE", "ACEITA", "AGENDADA", "CONCLUIDA"];
  const current =
    d.status === "CONCLUIDA"
      ? 3
      : d.agendamento
        ? 2
        : d.status === "ACEITA"
          ? 1
          : 0;
  return (
    <>
      <Link
        className="back-link"
        to={churchMode ? "/igreja/solicitacoes" : "/doador/historico"}
      >
        <ArrowLeft size={16} />
        Voltar para {churchMode ? "solicitações" : "histórico"}
      </Link>
      <PageHead
        eyebrow={`DOAÇÃO DOA-${String(d.id).padStart(3, "0")}`}
        title={
          churchMode
            ? scheduling
              ? "Agendar e receber"
              : "Cada solicitação merece cuidado."
            : "Seu gesto está em boas mãos."
        }
        description={`Enviada em ${dayLabel(d.created_at)} · ${d.igreja.nome} · Fictícia`}
        action={<StatusBadge donation={d} />}
      />
      <ErrorMessage>{error}</ErrorMessage>
      <div className="detail-grid">
        <div>
          <section className="card padded">
            <h2>
              {churchMode
                ? "Itens para análise"
                : "O que você está compartilhando"}
            </h2>
            <p className="micro">Doador: {d.doador.nome} · Perfil fictício</p>
            <div className="detail-items">
              {d.itens.map((i) => (
                <div key={i.id}>
                  <span className="icon-tile">
                    <CategoryIcon slug={i.categoria_slug} />
                  </span>
                  <div>
                    <strong>{i.descricao}</strong>
                    <p>
                      {i.quantidade} unidade(s) ·{" "}
                      {i.condicao === "NOVO" ? "Novo / lacrado" : "Bom estado"}
                    </p>
                    <small>
                      {i.categoria}
                      {i.validade ? ` · Validade: ${dayLabel(i.validade)}` : ""}
                    </small>
                  </div>
                </div>
              ))}
            </div>
            {d.campanha && (
              <p>
                Campanha:{" "}
                <Link className="text-link" to={`/campanhas/${d.campanha_id}`}>
                  {d.campanha.titulo}
                </Link>
              </p>
            )}
            <p className="micro icon-line">
              <ImageOff size={16} />
              Fotos não são armazenadas nesta demonstração.
            </p>
          </section>
          <section className="card padded section-space">
            <h2>O caminho da sua doação</h2>
            {d.status !== "RECUSADA" ? (
              <ol className="status-steps">
                {steps.map((s, index) => (
                  <li className={index <= current ? "done" : ""} key={s}>
                    <span>
                      {index <= current ? <Check size={15} /> : index + 1}
                    </span>
                    <small>
                      {s === "AGENDADA" ? "Agendamento" : statuses[s]}
                    </small>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="notice refusal">
                <p>
                  <strong>Doação recusada</strong>
                  <br />
                  {d.motivo_recusa || "A igreja não informou um motivo."}
                  <br />A solicitação permanece no seu histórico.
                </p>
              </div>
            )}
            <ol className="event-timeline">
              {d.eventos.map((e) => (
                <li key={e.id}>
                  <span />
                  <div>
                    <strong>
                      {e.tipo === "AGENDADA" ? "Agendamento" : statuses[e.tipo]}
                    </strong>
                    <p>{e.descricao}</p>
                    <small>{dayLabel(e.created_at)}</small>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
        <aside>
          <section className="card padded">
            <h2>Como será o encontro</h2>
            <div className="delivery-info">
              {d.modalidade === "COLETA" ? <Truck /> : <Church />}
              <div>
                <strong>
                  {d.modalidade === "COLETA"
                    ? "Coleta pela própria igreja"
                    : "Entrega presencial"}
                </strong>
                <p>
                  {d.modalidade === "COLETA"
                    ? d.endereco_coleta_ficticio
                    : d.igreja.endereco_publico_ficticio}
                </p>
                <span className="micro">Endereço fictício · Demonstração</span>
              </div>
            </div>
            {d.agendamento ? (
              <div className="schedule-summary">
                <CalendarDays size={23} />
                <div>
                  <strong>{dayLabel(d.agendamento.data)}</strong>
                  <p>{periods[d.agendamento.periodo]}</p>
                  {d.agendamento.observacoes && (
                    <small>{d.agendamento.observacoes}</small>
                  )}
                </div>
              </div>
            ) : (
              <div className="notice">
                <p>
                  {d.status === "PENDENTE"
                    ? "O agendamento estará disponível após a igreja aceitar a solicitação."
                    : d.status === "RECUSADA"
                      ? "Esta solicitação não possui agendamento."
                      : "A igreja ainda vai combinar a data e o período."}
                </p>
              </div>
            )}
            <p className="micro">
              O DoaES não transporta itens. A igreja realiza a coleta quando
              oferece essa modalidade.
            </p>
          </section>
          {churchMode && d.status === "PENDENTE" && (
            <section className="card padded section-space">
              <h2>Decisão da igreja</h2>
              <p>Confira se os itens atendem às necessidades da instituição.</p>
              {refusing ? (
                <>
                  <Field label="Motivo da recusa (opcional)">
                    <textarea
                      maxLength={500}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Conte por que a doação não poderá ser recebida."
                    />
                  </Field>
                  <Button
                    variant="danger"
                    className="full"
                    disabled={busy}
                    onClick={() =>
                      action(
                        "decisao",
                        { status: "RECUSADA", motivo_recusa: reason },
                        "Recusa registrada. A doação continua no histórico.",
                      )
                    }
                  >
                    Confirmar recusa
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={busy}
                    onClick={() => setRefusing(false)}
                  >
                    Voltar à análise
                  </Button>
                </>
              ) : (
                <div className="stack">
                  <Button
                    disabled={busy}
                    onClick={() =>
                      action(
                        "decisao",
                        { status: "ACEITA" },
                        "Doação aceita! Agora você pode combinar o agendamento.",
                      )
                    }
                  >
                    <Check size={17} />
                    {busy ? "Salvando…" : "Aceitar doação"}
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => setRefusing(true)}
                  >
                    Recusar doação
                  </Button>
                </div>
              )}
            </section>
          )}
          {churchMode && d.status === "ACEITA" && (
            <section className="card padded section-space">
              <h2>
                {d.agendamento
                  ? "Ajustar agendamento"
                  : "Vamos combinar o recebimento?"}
              </h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  action(
                    "agendamento",
                    { data, periodo: period, observacoes: notes },
                    "Agendamento salvo e disponível para o doador.",
                  );
                }}
              >
                <Field label="Data combinada *">
                  <input
                    type="date"
                    required
                    min={today()}
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                  />
                </Field>
                <Field label="Período *">
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                  >
                    {Object.entries(periods).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Observações (fictícias)">
                  <textarea
                    maxLength={1000}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </Field>
                <Button type="submit" disabled={busy} className="full">
                  {busy ? "Salvando…" : "Salvar agendamento"}
                </Button>
              </form>
              {d.agendamento && (
                <div className="completion">
                  <h3>Os itens já chegaram?</h3>
                  <p>
                    Confirme somente após o recebimento da doação na
                    demonstração.
                  </p>
                  <Button
                    className="full"
                    disabled={busy}
                    onClick={() =>
                      action(
                        "concluir",
                        {},
                        "Recebimento confirmado! O histórico do doador foi atualizado.",
                      )
                    }
                  >
                    <Check size={18} />
                    Confirmar recebimento
                  </Button>
                </div>
              )}
            </section>
          )}
          {d.status === "CONCLUIDA" && (
            <section className="success-card section-space">
              <Heart size={32} />
              <h2>Um gesto que chegou ao destino.</h2>
              <p>
                A igreja confirmou o recebimento. Obrigado por compartilhar
                cuidado!
              </p>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
