import { cloneElement, useId } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Heart,
  MapPin,
  Shirt,
  Blocks,
  Wheat,
  Sparkles,
  Package,
  Church,
  Truck,
  Search,
} from "lucide-react";
import { dayLabel, statuses } from "../services/api";

export function Logo() {
  return (
    <Link className="brand" to="/" aria-label="DoaES, início">
      <span className="brand-symbol">
        <Heart size={22} fill="currentColor" />
      </span>
      <span>
        doa<span>ES</span>
      </span>
    </Link>
  );
}
export function Button({
  to,
  children,
  variant = "",
  className = "",
  ...props
}) {
  const cls = `button ${variant} ${className}`;
  return to ? (
    <Link className={cls} to={to} {...props}>
      {children}
    </Link>
  ) : (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}
export function PageHead({ eyebrow, title, description, action }) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function SectionHead({ title, to, link = "Ver todas" }) {
  return (
    <div className="section-head">
      <h2>{title}</h2>
      {to && (
        <Link className="text-link" to={to}>
          {link}
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}
export function StatusBadge({ donation }) {
  return (
    <span className={`badge status-${donation.status.toLowerCase()}`}>
      <i />
      {donation.status === "ACEITA" && donation.agendamento
        ? "Agendada"
        : statuses[donation.status]}
    </span>
  );
}
export function ErrorMessage({ children }) {
  return children ? (
    <div className="error-message" role="alert">
      {children}
    </div>
  ) : null;
}
export function Empty({
  title = "Nenhum resultado por aqui",
  description = "Tente ajustar os filtros ou comece uma nova doação.",
  action,
}) {
  return (
    <div className="empty">
      <Package size={38} />
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function Field({ label, hint, children, className = "" }) {
  const fieldId = useId();
  return (
    <div className={`field ${className}`}>
      <label htmlFor={fieldId}>{label}</label>
      {cloneElement(children, {
        id: fieldId,
        "aria-describedby": hint ? `${fieldId}-hint` : undefined,
      })}
      {hint && <small id={`${fieldId}-hint`}>{hint}</small>}
    </div>
  );
}
export function CategoryIcon({ slug, size = 22, ...props }) {
  const Icon =
    { roupas: Shirt, brinquedos: Blocks, alimentos: Wheat, higiene: Sparkles }[
      slug
    ] || Package;
  return <Icon size={size} {...props} />;
}
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
export function SearchField({ value, onChange, placeholder = "Buscar…" }) {
  return (
    <label className="search-field">
      <Search size={18} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
export function DonationArt({ compact = false }) {
  return (
    <svg
      className={`donation-art ${compact ? "compact" : ""}`}
      viewBox="0 0 500 400"
      aria-hidden="true"
    >
      <circle cx="280" cy="190" r="160" fill="#c8e8d6" />
      <circle cx="290" cy="190" r="128" fill="#ddf0e4" />
      <path d="M65 337h385" stroke="#b9d6c8" strokeWidth="2" />
      <path d="M310 185c-40-75 90-75 53 0l-27 33Z" fill="#0e826c" />
      <path d="m336 210 0 80" stroke="#176d56" strokeWidth="4" />
      <path
        d="M335 257c-55 4-51-39-51-39 43 0 51 39 51 39M338 280c53 3 51-39 51-39-40 0-51 39-51 39"
        fill="#76b89b"
      />
      <path d="m319 281-13 56h63l-12-56" fill="#e8b88a" />
      <rect x="91" y="221" width="177" height="115" rx="9" fill="#d8af7e" />
      <path d="M91 232h177v19H91z" fill="#c09868" />
      <path d="m90 221 25-33h142l12 33" fill="#edcea4" />
      <path d="m177 191 1 146" stroke="#e9c895" strokeWidth="20" />
      <path d="M178 265c-36-41-69 10 0 48 69-38 35-89 0-48" fill="#fffaf0" />
      <rect
        x="104"
        y="136"
        width="137"
        height="48"
        rx="9"
        fill="#93c4aa"
        transform="rotate(-8 104 136)"
      />
      <path
        d="m119 141 36-30 23 13 21-20 32 24"
        fill="none"
        stroke="#fff"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="105" cy="89" r="24" fill="#fff" />
      <path
        d="m95 89 7 7 14-15"
        fill="none"
        stroke="#0e826c"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M402 119v20m-10-10h20M66 196v12m-6-6h12"
        stroke="#3c9577"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M231 64c-10-15-25 4 0 19 24-15 9-34 0-19" fill="#cf9e6a" />
    </svg>
  );
}
