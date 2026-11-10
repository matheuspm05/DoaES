import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const databasePath = fileURLToPath(
  new URL("../../data/doaes.sqlite", import.meta.url),
);

export function transaction(db, work) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = work();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function createDatabase(path = databasePath) {
  if (path !== ":memory:")
    mkdirSync(dirname(resolve(path)), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec("PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  db.exec(
    "CREATE TABLE IF NOT EXISTS igrejas (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL)",
  );
  // A primeira versão possuía somente id e nome. Migração aditiva preserva seus registros.
  const columns = new Set(
    db
      .prepare("PRAGMA table_info(igrejas)")
      .all()
      .map((c) => c.name),
  );
  const additions = {
    demo_key: "TEXT",
    descricao: "TEXT NOT NULL DEFAULT ''",
    cidade: "TEXT NOT NULL DEFAULT 'Vila Velha'",
    bairro: "TEXT NOT NULL DEFAULT ''",
    endereco_publico_ficticio: "TEXT NOT NULL DEFAULT ''",
    oferece_coleta: "INTEGER NOT NULL DEFAULT 0",
    area_coleta: "TEXT NOT NULL DEFAULT ''",
    condicoes_coleta: "TEXT NOT NULL DEFAULT ''",
  };
  for (const [name, definition] of Object.entries(additions)) {
    if (!columns.has(name))
      db.exec(`ALTER TABLE igrejas ADD COLUMN ${name} ${definition}`);
  }
  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS igrejas_demo_key ON igrejas(demo_key);
    CREATE TABLE IF NOT EXISTS categorias (id INTEGER PRIMARY KEY, nome TEXT NOT NULL, slug TEXT UNIQUE NOT NULL);
    CREATE TABLE IF NOT EXISTS igreja_categorias (
      igreja_id INTEGER NOT NULL REFERENCES igrejas(id), categoria_id INTEGER NOT NULL REFERENCES categorias(id),
      PRIMARY KEY (igreja_id, categoria_id)
    );
    CREATE TABLE IF NOT EXISTS doadores_demo (id INTEGER PRIMARY KEY, nome TEXT NOT NULL, cidade TEXT NOT NULL, email TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS campanhas (
      id INTEGER PRIMARY KEY AUTOINCREMENT, demo_key TEXT UNIQUE, igreja_id INTEGER NOT NULL REFERENCES igrejas(id),
      titulo TEXT NOT NULL, descricao TEXT NOT NULL, categoria_id INTEGER REFERENCES categorias(id),
      ativa INTEGER NOT NULL DEFAULT 1 CHECK(ativa IN (0,1)),
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
    CREATE TABLE IF NOT EXISTS doacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT, demo_key TEXT UNIQUE,
      doador_demo_id INTEGER NOT NULL REFERENCES doadores_demo(id), igreja_id INTEGER NOT NULL REFERENCES igrejas(id),
      campanha_id INTEGER REFERENCES campanhas(id), modalidade TEXT NOT NULL CHECK(modalidade IN ('COLETA','ENTREGA')),
      endereco_coleta_ficticio TEXT, status TEXT NOT NULL DEFAULT 'PENDENTE'
        CHECK(status IN ('PENDENTE','ACEITA','RECUSADA','CONCLUIDA')), motivo_recusa TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
    CREATE TABLE IF NOT EXISTS itens_doacao (
      id INTEGER PRIMARY KEY AUTOINCREMENT, doacao_id INTEGER NOT NULL REFERENCES doacoes(id),
      categoria_id INTEGER NOT NULL REFERENCES categorias(id), descricao TEXT NOT NULL,
      quantidade INTEGER NOT NULL CHECK(quantidade > 0), condicao TEXT NOT NULL, validade TEXT
    );
    CREATE TABLE IF NOT EXISTS agendamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT, doacao_id INTEGER UNIQUE NOT NULL REFERENCES doacoes(id),
      data TEXT NOT NULL, periodo TEXT NOT NULL, observacoes TEXT,
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
    CREATE TABLE IF NOT EXISTS eventos_doacao (
      id INTEGER PRIMARY KEY AUTOINCREMENT, doacao_id INTEGER NOT NULL REFERENCES doacoes(id),
      tipo TEXT NOT NULL, descricao TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
    CREATE INDEX IF NOT EXISTS doacoes_doador ON doacoes(doador_demo_id);
    CREATE INDEX IF NOT EXISTS doacoes_igreja ON doacoes(igreja_id);
  `);
  return db;
}
