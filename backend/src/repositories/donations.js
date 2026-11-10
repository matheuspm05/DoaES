import { getChurch } from "./churches.js";
import { find } from "./records.js";

export function donationDetail(db, donation) {
  return {
    ...donation,
    igreja: getChurch(db, donation.igreja_id),
    doador: find(db, "doadores_demo", donation.doador_demo_id),
    campanha: donation.campanha_id
      ? find(db, "campanhas", donation.campanha_id)
      : null,
    itens: db
      .prepare(
        "SELECT i.*,c.nome categoria,c.slug categoria_slug FROM itens_doacao i JOIN categorias c ON i.categoria_id=c.id WHERE doacao_id=?",
      )
      .all(donation.id),
    agendamento:
      db
        .prepare("SELECT * FROM agendamentos WHERE doacao_id=?")
        .get(donation.id) ?? null,
    eventos: db
      .prepare("SELECT * FROM eventos_doacao WHERE doacao_id=? ORDER BY id")
      .all(donation.id),
  };
}
export const getDonation = (db, id) =>
  donationDetail(db, find(db, "doacoes", id));
export function listDonations(db, filters, values) {
  return db
    .prepare(
      `SELECT * FROM doacoes ${filters.length ? "WHERE " + filters.join(" AND ") : ""} ORDER BY id DESC`,
    )
    .all(...values)
    .map((d) => donationDetail(db, d));
}
export function insertDonation(db, body, validated) {
  const { igreja, donor, address, campaign, items } = validated;
  const id = Number(
    db
      .prepare(
        "INSERT INTO doacoes (doador_demo_id,igreja_id,campanha_id,modalidade,endereco_coleta_ficticio) VALUES (?,?,?,?,?)",
      )
      .run(donor.id, igreja.id, campaign?.id ?? null, body.modalidade, address)
      .lastInsertRowid,
  );
  items.forEach((item) =>
    db
      .prepare(
        "INSERT INTO itens_doacao (doacao_id,categoria_id,descricao,quantidade,condicao,validade) VALUES (?,?,?,?,?,?)",
      )
      .run(
        id,
        item.categoria_id,
        item.descricao,
        item.quantidade,
        item.condicao,
        item.validade,
      ),
  );
  return id;
}
export function saveDecision(db, id, status, reason) {
  db.prepare("UPDATE doacoes SET status=?,motivo_recusa=? WHERE id=?").run(
    status,
    reason,
    id,
  );
}
export function saveSchedule(db, id, day, period, notes) {
  db.prepare(
    "INSERT INTO agendamentos (doacao_id,data,periodo,observacoes) VALUES (?,?,?,?) ON CONFLICT(doacao_id) DO UPDATE SET data=excluded.data,periodo=excluded.periodo,observacoes=excluded.observacoes,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')",
  ).run(id, day, period, notes);
}
export const hasSchedule = (db, id) =>
  Boolean(db.prepare("SELECT 1 FROM agendamentos WHERE doacao_id=?").get(id));
export function completeDonation(db, id) {
  db.prepare("UPDATE doacoes SET status='CONCLUIDA' WHERE id=?").run(id);
}
export function recordEvent(db, id, type, description) {
  db.prepare(
    "INSERT INTO eventos_doacao (doacao_id,tipo,descricao) VALUES (?,?,?)",
  ).run(id, type, description);
  db.prepare(
    "UPDATE doacoes SET updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?",
  ).run(id);
}
