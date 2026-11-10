import { find } from "../repositories/records.js";
import { acceptsCategory } from "../repositories/churches.js";
import {
  listCampaigns,
  getCampaign,
  insertCampaign,
  saveCampaign,
} from "../repositories/campaigns.js";
import { requireValue } from "../utils/errors.js";
import { text, id } from "../utils/validation.js";

export function searchCampaigns(db, query) {
  return listCampaigns(db).filter(
    (c) =>
      (!query.igreja_id || c.igreja_id === id(query.igreja_id)) &&
      (!query.ativa || c.ativa === (query.ativa === "true")),
  );
}
function campaignValues(db, body) {
  const church = find(db, "igrejas", body.igreja_id),
    category = body.categoria_id ? id(body.categoria_id) : null;
  if (category) {
    find(db, "categorias", category);
    requireValue(
      acceptsCategory(db, church.id, category),
      "Escolha uma categoria aceita pela igreja.",
    );
  }
  requireValue(
    typeof body.ativa === "boolean",
    "Informe se a campanha está ativa.",
  );
  return [
    church.id,
    text(body.titulo, "Título", true, 120),
    text(body.descricao, "Descrição", true, 2000),
    category,
    Number(body.ativa),
  ];
}
export function createCampaign(db, input) {
  return getCampaign(db, insertCampaign(db, campaignValues(db, input)));
}
export function updateCampaign(db, campaignId, input) {
  const existing = getCampaign(db, campaignId);
  requireValue(
    !input.igreja_id || Number(input.igreja_id) === existing.igreja_id,
    "Não é possível transferir uma campanha.",
  );
  saveCampaign(db, existing.id, campaignValues(db, { ...existing, ...input }));
  return getCampaign(db, existing.id);
}
