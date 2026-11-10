import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { CategoryIcon } from "../categories/CategoryIcon.jsx";

export function CampaignCard({ campaign, manage }) {
  return (
    <article className="card campaign-card">
      <Link
        className={`campaign-art art-${campaign.categoria?.slug || "roupas"}`}
        to={
          manage
            ? `/igreja/campanhas/${campaign.id}/editar`
            : `/campanhas/${campaign.id}`
        }
        aria-label={campaign.titulo}
      >
        <span className="art-caption">
          PEQUENOS GESTOS.
          <br />
          NOVOS COMEÇOS.
        </span>
        <CategoryIcon
          slug={campaign.categoria?.slug}
          size={85}
          strokeWidth={1.15}
        />
        <span className="art-circle" />
        <span className="art-heart">♡</span>
      </Link>
      <div className="campaign-content">
        <div className="between">
          <span className="eyebrow">
            {campaign.categoria?.nome || "Solidariedade"}
          </span>
          <span
            className={`badge ${campaign.ativa ? "status-aceita" : "muted"}`}
          >
            {campaign.ativa ? "Ativa" : "Encerrada"}
          </span>
        </div>
        <h3>{campaign.titulo}</h3>
        <p className="micro">{campaign.igreja.nome} · Fictícia</p>
        <p className="clamp">{campaign.descricao}</p>
        <Link
          className="text-link"
          to={
            manage
              ? `/igreja/campanhas/${campaign.id}/editar`
              : `/campanhas/${campaign.id}`
          }
        >
          {manage ? "Gerenciar campanha" : "Conhecer campanha"}
          <ArrowRight size={17} />
        </Link>
      </div>
    </article>
  );
}
