import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { dayLabel } from "../../utils/dates";
import { StatusBadge } from "./StatusBadge.jsx";
import { Empty } from "../ui/Empty.jsx";
import { CategoryIcon } from "../categories/CategoryIcon.jsx";

export function DonationList({ donations, churchMode = false }) {
  return donations.length ? (
    <div className="donation-list">
      {donations.map((d) => (
        <Link
          className="donation-row"
          key={d.id}
          to={
            churchMode
              ? `/igreja/solicitacoes/${d.id}`
              : `/doador/doacoes/${d.id}`
          }
        >
          <span className="icon-tile">
            <CategoryIcon slug={d.itens[0]?.categoria_slug} />
          </span>
          <div className="donation-info">
            <strong>{churchMode ? d.doador.nome : d.igreja.nome}</strong>
            <span>{d.itens.map((i) => i.descricao).join(" · ")}</span>
            <small>
              DOA-{String(d.id).padStart(3, "0")} · {dayLabel(d.created_at)}
            </small>
          </div>
          <StatusBadge donation={d} />
          <ArrowRight className="row-arrow" size={18} />
        </Link>
      ))}
    </div>
  ) : (
    <Empty />
  );
}
