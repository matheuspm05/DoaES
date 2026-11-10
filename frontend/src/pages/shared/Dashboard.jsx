import {
  ArrowRight,
  Package,
  Clock3,
  CircleCheck,
  Megaphone,
  Plus,
  Heart,
} from "lucide-react";
import {
  Button,
  PageHead,
  SectionHead,
  DonationList,
  ChurchCard,
  DonationArt,
  Empty,
} from "../../components/index";
import { useDemo } from "../../contexts/demo";

export default function Dashboard({ churchMode = false }) {
  const { donations, church, donor, churches, campaigns } = useDemo();
  const mine = donations.filter((d) =>
    churchMode ? d.igreja_id === church.id : d.doador_demo_id === donor.id,
  );
  const pending = mine.filter((d) => d.status === "PENDENTE");
  const complete = mine.filter((d) => d.status === "CONCLUIDA");
  const ongoing = mine.filter(
    (d) => d.status === "ACEITA" || d.status === "PENDENTE",
  );
  const active = campaigns.filter((c) => c.igreja_id === church.id && c.ativa);
  const stats = churchMode
    ? [
        [pending.length, "Solicitações pendentes", Clock3, "amber"],
        [complete.length, "Doações recebidas", CircleCheck, "green"],
        [active.length, "Campanhas ativas", Megaphone, "blue"],
      ]
    : [
        [mine.length, "Doações cadastradas", Package, "green"],
        [ongoing.length, "Doações em andamento", Clock3, "amber"],
        [complete.length, "Doações concluídas", CircleCheck, "blue"],
      ];
  return (
    <>
      <PageHead
        eyebrow={
          churchMode
            ? "ACOLHER TAMBÉM É TRANSFORMAR"
            : "SEU ESPAÇO DE SOLIDARIEDADE"
        }
        title={
          churchMode
            ? "Painel da igreja"
            : `Olá, ${donor.nome.split(" ")[0]}! Que bom ter você aqui.`
        }
        description={
          churchMode
            ? `${church.nome} · Instituição fictícia`
            : "Todo gesto conta. Acompanhe suas doações e encontre sua próxima boa ação."
        }
        action={
          <Button
            to={churchMode ? "/igreja/campanhas/nova" : "/doador/nova-doacao"}
          >
            <Plus size={18} />
            {churchMode ? "Nova campanha" : "Nova doação"}
          </Button>
        }
      />
      <div className="grid three stats">
        {stats.map(([number, label, Icon, color]) => (
          <div className="card stat-card" key={label}>
            <span className={`icon-tile ${color}`}>
              <Icon size={21} />
            </span>
            <span className="stat-number">
              {String(number).padStart(2, "0")}
            </span>
            <span>{label}</span>
          </div>
        ))}
      </div>
      {churchMode ? (
        <div className="dashboard-columns">
          <section className="card padded">
            <SectionHead
              title="Esperando seu cuidado"
              to="/igreja/solicitacoes"
              link="Ver solicitações"
            />
            <DonationList donations={pending.slice(0, 4)} churchMode />
          </section>
          <aside className="impact-card">
            <Heart size={30} />
            <h2>
              Uma conexão.
              <br />
              Muitas possibilidades.
            </h2>
            <p>
              {complete.length
                ? `${complete.length} doação(ões) já foram recebidas por esta igreja na demonstração.`
                : "Suas próximas doações recebidas começam com uma análise cuidadosa."}
            </p>
            <div className="impact-count">
              {mine.reduce(
                (sum, d) =>
                  sum +
                  (d.status === "CONCLUIDA"
                    ? d.itens.reduce((n, i) => n + i.quantidade, 0)
                    : 0),
                0,
              )}
              <span>itens recebidos na demo</span>
            </div>
            <Button to="/igreja/agendamentos" variant="white">
              Ver agendamentos
              <ArrowRight size={17} />
            </Button>
          </aside>
        </div>
      ) : (
        <div className="dashboard-columns">
          <div className="donor-banner">
            <div>
              <span className="eyebrow">DÊ UM NOVO DESTINO AO QUE FAZ BEM</span>
              <h2>
                Tem um pouco de cuidado
                <br />
                para compartilhar?
              </h2>
              <p>Encontre uma igreja e conheça as campanhas da sua região.</p>
              <Button to="/igrejas">
                Explorar igrejas
                <ArrowRight size={17} />
              </Button>
            </div>
            <DonationArt compact />
          </div>
          <aside className="card padded latest">
            <span className="eyebrow">SUA ÚLTIMA DOAÇÃO</span>
            {mine[0] ? (
              <>
                <span className="icon-tile">
                  <Package size={23} />
                </span>
                <h3>{mine[0].itens[0]?.descricao}</h3>
                <p>{mine[0].igreja.nome}</p>
                <Button
                  variant="secondary"
                  to={`/doador/doacoes/${mine[0].id}`}
                >
                  Ver acompanhamento
                  <ArrowRight size={16} />
                </Button>
              </>
            ) : (
              <Empty
                title="Seu primeiro gesto"
                description="Comece uma doação e acompanhe por aqui."
              />
            )}
          </aside>
        </div>
      )}
      <section className="section-space">
        <SectionHead
          title={
            churchMode ? "Movimentações recentes" : "Suas doações recentes"
          }
          to={churchMode ? "/igreja/solicitacoes" : "/doador/historico"}
          link="Ver histórico"
        />
        <div className="card list-card">
          <DonationList donations={mine.slice(0, 3)} churchMode={churchMode} />
        </div>
      </section>
      {!churchMode && (
        <section className="section-space">
          <SectionHead
            title="Conheça quem pode receber seu gesto"
            to="/igrejas"
          />
          <div className="grid three">
            {churches.slice(0, 3).map((c) => (
              <ChurchCard key={c.id} church={c} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
