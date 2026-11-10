import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { useDemo } from "../contexts/demo";
import { PageHead, Button, DonationList, SearchField } from "../components/ui";
import { statuses } from "../services/api";

export default function DonationHistory({
  churchMode = false,
  scheduling = false,
  tracking = false,
}) {
  const { donations, church, donor } = useDemo();
  const [params] = useSearchParams();
  const [status, setStatus] = useState(params.get("status") || "");
  const [search, setSearch] = useState("");
  const mine = donations.filter(
    (d) =>
      (churchMode
        ? d.igreja_id === church.id
        : d.doador_demo_id === donor.id) &&
      (!scheduling || d.status === "ACEITA") &&
      (!status ||
        (status === "AGENDADA"
          ? d.status === "ACEITA" && d.agendamento
          : d.status === status)) &&
      `${d.id} ${d.igreja.nome} ${d.doador.nome} ${d.itens.map((i) => i.descricao).join(" ")}`
        .toLocaleLowerCase("pt-BR")
        .includes(search.toLocaleLowerCase("pt-BR")),
  );
  return (
    <>
      <PageHead
        eyebrow={
          churchMode ? "CUIDADO EM CADA ETAPA" : "CADA GESTO TEM UMA HISTÓRIA"
        }
        title={
          scheduling
            ? "Agendamentos e recebimentos"
            : churchMode
              ? "Solicitações recebidas"
              : tracking
                ? "Acompanhar doações"
                : "Meu histórico de doações"
        }
        description={
          scheduling
            ? "Combine data e período e confirme os itens recebidos."
            : churchMode
              ? "Analise os itens, acolha solicitações e acompanhe cada entrega."
              : "Da intenção ao recebimento: acompanhe suas conexões de solidariedade."
        }
        action={
          !churchMode && (
            <Button to="/doador/nova-doacao">
              <Plus size={18} />
              Nova doação
            </Button>
          )
        }
      />
      <div className="filter-bar">
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Buscar por igreja, item, doador ou número"
        />
        {!scheduling && (
          <select
            aria-label="Filtrar por status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Todos os status</option>
            {Object.entries(statuses).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
            <option value="AGENDADA">Agendada</option>
          </select>
        )}
      </div>
      <p className="results-line">
        {mine.length}{" "}
        {mine.length === 1 ? "doação encontrada" : "doações encontradas"} ·
        Dados fictícios
      </p>
      <section className="card list-card">
        <DonationList donations={mine} churchMode={churchMode} />
      </section>
    </>
  );
}
