import { transaction } from "../database/index.js";
import { find } from "../repositories/records.js";
import {
  getDonation,
  listDonations,
  insertDonation,
  saveDecision,
  saveSchedule,
  hasSchedule,
  completeDonation,
  recordEvent,
} from "../repositories/donations.js";
import { requireValue } from "../utils/errors.js";
import { id, text } from "../utils/validation.js";
import { date, today } from "../utils/dates.js";
import { validateDonation } from "../validators/donation.js";

export function searchDonations(db, query) {
  const filters = [],
    values = [];
  for (const key of ["doador_demo_id", "igreja_id"])
    if (query[key]) {
      filters.push(`${key}=?`);
      values.push(id(query[key]));
    }
  if (query.status) {
    requireValue(
      ["PENDENTE", "ACEITA", "RECUSADA", "CONCLUIDA"].includes(query.status),
      "Status inválido.",
    );
    filters.push("status=?");
    values.push(query.status);
  }
  return listDonations(db, filters, values);
}
export function createDonation(db, body) {
  const validated = validateDonation(db, body);
  const donationId = transaction(db, () => {
    const donationId = insertDonation(db, body, validated);
    recordEvent(
      db,
      donationId,
      "PENDENTE",
      "Doação enviada para análise da igreja.",
    );
    return donationId;
  });
  return getDonation(db, donationId);
}
export function decideDonation(db, donationId, body) {
  const donation = find(db, "doacoes", donationId);
  requireValue(
    donation.status === "PENDENTE",
    "Somente doações pendentes podem ser analisadas.",
    409,
  );
  requireValue(
    ["ACEITA", "RECUSADA"].includes(body.status),
    "Escolha ACEITA ou RECUSADA.",
  );
  const reason =
    body.status === "RECUSADA"
      ? text(body.motivo_recusa, "Motivo da recusa", false, 500)
      : null;
  transaction(db, () => {
    saveDecision(db, donation.id, body.status, reason);
    recordEvent(
      db,
      donation.id,
      body.status,
      body.status === "ACEITA"
        ? "Solicitação aceita pela igreja."
        : "Solicitação recusada pela igreja.",
    );
  });
  return getDonation(db, donation.id);
}
export function scheduleDonation(db, donationId, body) {
  const donation = find(db, "doacoes", donationId);
  requireValue(
    donation.status === "ACEITA",
    "O agendamento exige uma doação aceita.",
    409,
  );
  const day = date(body.data, "Data do agendamento");
  requireValue(day >= today(), "Escolha uma data a partir de hoje.");
  requireValue(
    ["MANHA", "TARDE", "NOITE"].includes(body.periodo),
    "Período inválido.",
  );
  const notes = text(body.observacoes, "Observações", false, 1000);
  transaction(db, () => {
    saveSchedule(db, donation.id, day, body.periodo, notes);
    recordEvent(
      db,
      donation.id,
      "AGENDADA",
      `Agendamento combinado: ${day}, ${body.periodo.toLowerCase()}.`,
    );
  });
  return getDonation(db, donation.id);
}
export function receiveDonation(db, donationId) {
  const donation = find(db, "doacoes", donationId);
  requireValue(
    donation.status === "ACEITA",
    "Somente doações aceitas podem ser concluídas.",
    409,
  );
  requireValue(
    hasSchedule(db, donation.id),
    "Agende a doação antes de confirmar o recebimento.",
    409,
  );
  transaction(db, () => {
    completeDonation(db, donation.id);
    recordEvent(
      db,
      donation.id,
      "CONCLUIDA",
      "Recebimento confirmado. Obrigado por fazer a diferença!",
    );
  });
  return getDonation(db, donation.id);
}
