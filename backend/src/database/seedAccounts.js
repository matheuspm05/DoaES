// Optional local-only credentials, supplied by the developer outside Git.
import "dotenv/config";
import { createDatabase } from "./index.js";
import { seed } from "./seed.js";
import { hashPassword } from "../services/auth.js";
if (process.env.NODE_ENV === "production")
  throw new Error("Contas de seed são permitidas somente localmente.");
const senha = process.env.LOCAL_SEED_PASSWORD;
if (!senha || senha.length < 10 || senha.length > 128)
  throw new Error(
    "Defina LOCAL_SEED_PASSWORD (10 a 128 caracteres) somente no ambiente local.",
  );
const hash = await hashPassword(senha),
  db = createDatabase(process.env.SQLITE_PATH);
try {
  seed(db);
  for (const [tipo, table, col] of [
    ["DOADOR", "doadores_demo", "doador_id"],
    ["IGREJA", "igrejas", "igreja_id"],
  ]) {
    for (const { id } of db
      .prepare(
        `SELECT id FROM ${table} WHERE ${tipo === "DOADOR" ? "id IN (1,2)" : "demo_key IS NOT NULL"}`,
      )
      .all()) {
      db.prepare(
        `INSERT OR IGNORE INTO usuarios (email,senha_hash,tipo,${col}) VALUES (?,?,?,?)`,
      ).run(`${tipo.toLowerCase()}${id}@exemplo.invalid`, hash, tipo, id);
    }
  }
  console.log(
    "Contas locais criadas sem sobrescrever contas existentes. E-mails: doador1@exemplo.invalid, igreja1@exemplo.invalid (e IDs dos demais registros do seed). Senha fornecida pelo ambiente.",
  );
} finally {
  db.close();
}
