export const listCategories = (db) =>
  db.prepare("SELECT * FROM categorias").all();
