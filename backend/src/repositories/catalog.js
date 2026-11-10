export const listCategories = (db) =>
  db.prepare("SELECT * FROM categorias").all();
export const listDemoDonors = (db) =>
  db.prepare("SELECT * FROM doadores_demo").all();
