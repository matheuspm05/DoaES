import { find } from "./records.js";

export function churchDetail(db, church) {
  return {
    ...church,
    oferece_coleta: Boolean(church.oferece_coleta),
    categorias: db
      .prepare(
        "SELECT c.* FROM categorias c JOIN igreja_categorias ic ON ic.categoria_id=c.id WHERE ic.igreja_id=?",
      )
      .all(church.id),
  };
}
export const getChurch = (db, id) => churchDetail(db, find(db, "igrejas", id));
export const listChurches = (db) =>
  db
    .prepare("SELECT * FROM igrejas ORDER BY id")
    .all()
    .map((c) => churchDetail(db, c));
export const acceptsCategory = (db, churchId, categoryId) =>
  Boolean(
    db
      .prepare(
        "SELECT 1 FROM igreja_categorias WHERE igreja_id=? AND categoria_id=?",
      )
      .get(churchId, categoryId),
  );
export function saveChurch(db, churchId, values, categories) {
  db.prepare(
    "UPDATE igrejas SET nome=?,descricao=?,cidade=?,bairro=?,endereco_publico_ficticio=?,oferece_coleta=?,area_coleta=?,condicoes_coleta=? WHERE id=?",
  ).run(...values, churchId);
  db.prepare("DELETE FROM igreja_categorias WHERE igreja_id=?").run(churchId);
  categories.forEach((category) =>
    db
      .prepare("INSERT INTO igreja_categorias VALUES (?,?)")
      .run(churchId, category),
  );
}
