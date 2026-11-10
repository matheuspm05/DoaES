import { statuses } from "../../constants/donations";

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
