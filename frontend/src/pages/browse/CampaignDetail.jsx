import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Church, Heart } from "lucide-react";
import { Button, Empty, CategoryIcon } from "../../components/index";
import { useDemo } from "../../contexts/demo";

export function CampaignDetail() {
  const { id } = useParams();
  const { campaigns } = useDemo();
  const c = campaigns.find((c) => c.id === Number(id));
  if (!c)
    return (
      <Empty
        title="Campanha não encontrada"
        action={<Button to="/campanhas">Ver campanhas</Button>}
      />
    );
  return (
    <>
      <Link className="back-link" to="/campanhas">
        <ArrowLeft size={16} />
        Voltar para campanhas
      </Link>
      <div className="campaign-detail">
        <div
          className={`campaign-art detail-art art-${c.categoria?.slug || "roupas"}`}
        >
          <span className="art-caption">
            CUIDADO QUE
            <br />
            SE COMPARTILHA.
          </span>
          <CategoryIcon slug={c.categoria?.slug} size={150} strokeWidth={1} />
          <span className="art-heart">♡</span>
        </div>
        <div className="card padded">
          <span className="eyebrow">
            CAMPANHA FICTÍCIA · {c.ativa ? "ATIVA" : "ENCERRADA"}
          </span>
          <h1>{c.titulo}</h1>
          <Link className="text-link" to={`/igrejas/${c.igreja_id}`}>
            <Church size={18} />
            {c.igreja.nome}
          </Link>
          <p>{c.descricao}</p>
          <div className="notice">
            <Heart size={20} />
            <p>
              {c.categoria?.nome || "Todas as categorias aceitas pela igreja"}.
              Doe itens em bom estado. Alimentos devem ser não perecíveis,
              lacrados e dentro da validade.
            </p>
          </div>
          {c.ativa ? (
            <Button
              to={`/doador/nova-doacao?igreja=${c.igreja_id}&campanha=${c.id}`}
            >
              Contribuir com esta campanha
              <ArrowRight size={18} />
            </Button>
          ) : (
            <Button to="/campanhas">Encontrar uma campanha ativa</Button>
          )}
        </div>
      </div>
    </>
  );
}
