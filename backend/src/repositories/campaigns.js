import { getChurch } from "./churches.js";
import { find } from "./records.js";

function campaignDetail(db, campaign) {
  return {
    ...campaign,
    ativa: Boolean(campaign.ativa),
    igreja: getChurch(db, campaign.igreja_id),
    categoria: campaign.categoria_id
      ? find(db, "categorias", campaign.categoria_id)
      : null,
  };
}
export const getCampaign = (db, id) =>
  campaignDetail(db, find(db, "campanhas", id));
export const listCampaigns = (db) =>
  db
    .prepare("SELECT * FROM campanhas ORDER BY id DESC")
    .all()
    .map((c) => campaignDetail(db, c));
export const insertCampaign = (db, values) =>
  Number(
    db
      .prepare(
        "INSERT INTO campanhas (igreja_id,titulo,descricao,categoria_id,ativa) VALUES (?,?,?,?,?)",
      )
      .run(...values).lastInsertRowid,
  );
export function saveCampaign(db, id, values) {
  db.prepare(
    "UPDATE campanhas SET igreja_id=?,titulo=?,descricao=?,categoria_id=?,ativa=?,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?",
  ).run(...values, id);
}
