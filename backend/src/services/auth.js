import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { promisify } from "node:util";
import { getChurch } from "../repositories/churches.js";
const scrypt = promisify(scryptCallback);
export const random = () => randomBytes(32).toString("hex");
export const digest = (value) =>
  createHash("sha256").update(value).digest("hex");
export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt:${salt}:${Buffer.from(await scrypt(password, salt, 64)).toString("hex")}`;
}
export async function verify(password, stored) {
  const [, salt, hash] = stored.split(":");
  const actual = Buffer.from(await scrypt(password, salt, 64));
  const expected = Buffer.from(hash, "hex");
  return expected.length === actual.length && timingSafeEqual(actual, expected);
}
export function account(db, id) {
  const user = db
    .prepare(
      "SELECT id,email,tipo,doador_id,igreja_id FROM usuarios WHERE id=?",
    )
    .get(id);
  if (!user) return null;
  return {
    ...user,
    perfil:
      user.tipo === "IGREJA"
        ? getChurch(db, user.igreja_id)
        : db
            .prepare(
              "SELECT id,nome,email,cidade,contato FROM doadores_demo WHERE id=?",
            )
            .get(user.doador_id),
  };
}
