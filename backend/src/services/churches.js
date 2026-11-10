import { transaction } from "../database/index.js";
import { find } from "../repositories/records.js";
import { getChurch, saveChurch } from "../repositories/churches.js";
import { requireValue } from "../utils/errors.js";
import { id, text } from "../utils/validation.js";

export function updateChurch(db, churchId, input) {
  const existing = getChurch(db, churchId),
    body = { ...existing, ...input };
  const values = [
    "nome",
    "descricao",
    "cidade",
    "bairro",
    "endereco_publico_ficticio",
  ].map((k) => text(body[k], k, true, k === "descricao" ? 2000 : 300));
  requireValue(
    ["Vila Velha", "Vitória"].includes(body.cidade),
    "Escolha Vila Velha ou Vitória.",
  );
  requireValue(
    typeof body.oferece_coleta === "boolean",
    "Informe se oferece coleta.",
  );
  const area = text(body.area_coleta, "Área de coleta", false, 500),
    conditions = text(
      body.condicoes_coleta,
      "Condições de coleta",
      false,
      1000,
    );
  const categories = input.categorias ?? existing.categorias.map((c) => c.id);
  requireValue(
    Array.isArray(categories) &&
      categories.length > 0 &&
      categories.length <= 4,
    "Selecione ao menos uma categoria.",
  );
  const unique = [...new Set(categories.map((c) => id(c, "Categoria")))];
  unique.forEach((category) => find(db, "categorias", category));
  transaction(db, () =>
    saveChurch(
      db,
      existing.id,
      [...values, Number(body.oferece_coleta), area, conditions],
      unique,
    ),
  );
  return getChurch(db, existing.id);
}
