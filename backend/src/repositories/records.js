import { id } from "../utils/validation.js";
import { requireValue } from "../utils/errors.js";

// Os nomes das tabelas são definidos pelo código, nunca pelo corpo ou query da API.
const tables = new Set([
  "igrejas",
  "categorias",
  "doadores_demo",
  "campanhas",
  "doacoes",
]);
export function find(db, table, value) {
  if (!tables.has(table)) throw new Error("Tabela não permitida.");
  const record = db.prepare(`SELECT * FROM ${table} WHERE id=?`).get(id(value));
  requireValue(record, "Registro não encontrado.", 404);
  return record;
}
