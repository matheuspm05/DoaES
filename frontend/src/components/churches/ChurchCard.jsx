import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Church, Truck } from "lucide-react";

export function ChurchCard({ church }) {
  return (
    <article className="card church-card">
      <div className="church-card-top">
        <span className="icon-tile">
          <Church size={26} />
        </span>
        <span className="micro">Instituição fictícia</span>
      </div>
      <h3>{church.nome}</h3>
      <p className="location">
        <MapPin size={14} />
        {church.bairro} · {church.cidade}
      </p>
      <div className="tags">
        {church.categorias.map((c) => (
          <span key={c.id}>{c.nome}</span>
        ))}
      </div>
      <p className="collection">
        <Truck size={15} />
        {church.oferece_coleta
          ? "Coleta pela igreja ou entrega"
          : "Somente entrega presencial"}
      </p>
      <Link className="text-link card-bottom" to={`/igrejas/${church.id}`}>
        Conhecer a igreja
        <ArrowRight size={17} />
      </Link>
    </article>
  );
}
