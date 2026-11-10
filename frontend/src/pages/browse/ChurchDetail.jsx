import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Church,
  MapPin,
  Truck,
  Heart,
  CalendarCheck,
} from "lucide-react";
import {
  Button,
  CampaignCard,
  Empty,
  SectionHead,
  CategoryIcon,
} from "../../components/index";
import { useDemo } from "../../contexts/demo";

export function ChurchDetail() {
  const { id } = useParams();
  const { churches, campaigns } = useDemo();
  const church = churches.find((c) => c.id === Number(id));
  if (!church)
    return (
      <Empty
        title="Igreja não encontrada"
        action={<Button to="/igrejas">Explorar igrejas</Button>}
      />
    );
  const active = campaigns.filter((c) => c.igreja_id === church.id && c.ativa);
  return (
    <>
      <Link className="back-link" to="/igrejas">
        <ArrowLeft size={16} />
        Voltar para igrejas
      </Link>
      <div className="church-profile-banner">
        <span className="profile-church-icon">
          <Church size={54} strokeWidth={1.3} />
        </span>
        <div>
          <span className="eyebrow">INSTITUIÇÃO FICTÍCIA</span>
          <h1>{church.nome}</h1>
          <p>
            <MapPin size={16} />
            {church.bairro} · {church.cidade}, ES
          </p>
        </div>
        <Button to={`/doador/nova-doacao?igreja=${church.id}`}>
          Quero doar
          <Heart size={18} />
        </Button>
      </div>
      <div className="detail-grid">
        <div className="card padded">
          <h2>Um pouco sobre esta igreja</h2>
          <p>{church.descricao}</p>
          <h3>O que você pode doar</h3>
          <div className="accepted-categories">
            {church.categorias.map((c) => (
              <span key={c.id}>
                <CategoryIcon slug={c.slug} />
                {c.nome}
              </span>
            ))}
          </div>
          <h3>Endereço público fictício</h3>
          <p className="location">
            <MapPin size={17} />
            {church.endereco_publico_ficticio}
          </p>
          <p className="micro">
            Este endereço é ilustrativo. Não utilize para entregas reais.
          </p>
        </div>
        <aside className="card padded">
          <h2>Como sua doação chega</h2>
          <div className="delivery-info">
            <Truck />
            <div>
              <strong>
                {church.oferece_coleta
                  ? "Coleta pela própria igreja"
                  : "Apenas entrega presencial"}
              </strong>
              <p>
                {church.condicoes_coleta ||
                  "Entrega presencial mediante agendamento."}
              </p>
              {church.oferece_coleta && <small>{church.area_coleta}</small>}
            </div>
          </div>
          <div className="delivery-info">
            <CalendarCheck />
            <div>
              <strong>Sempre com agendamento</strong>
              <p>A igreja analisa os itens antes de combinar data e período.</p>
            </div>
          </div>
          <Button
            to={`/doador/nova-doacao?igreja=${church.id}`}
            className="full"
          >
            Iniciar minha doação
            <ArrowRight size={17} />
          </Button>
        </aside>
      </div>
      <SectionHead title="Campanhas desta igreja" />
      {active.length ? (
        <div className="grid three">
          {active.map((c) => (
            <CampaignCard key={c.id} campaign={c} />
          ))}
        </div>
      ) : (
        <Empty
          title="Sem campanhas ativas"
          description="Você ainda pode fazer uma doação diretamente para esta igreja."
        />
      )}
    </>
  );
}
