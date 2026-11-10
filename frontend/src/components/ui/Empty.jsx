import { Package } from "lucide-react";

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
