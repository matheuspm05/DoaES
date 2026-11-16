import { randomBytes } from "node:crypto";
import { hashPassword } from "../../backend/src/services/auth.js";
export async function fixtureAccounts(db) {
  const password = randomBytes(20).toString("hex"),
    hash = await hashPassword(password);
  for (const [tipo, table, col] of [
    ["DOADOR", "doadores_demo", "doador_id"],
    ["IGREJA", "igrejas", "igreja_id"],
  ]) {
    for (const { id } of db.prepare(`SELECT id FROM ${table}`).all()) {
      db.prepare(
        `INSERT OR IGNORE INTO usuarios (email,senha_hash,tipo,${col}) VALUES (?,?,?,?)`,
      ).run(`${tipo.toLowerCase()}${id}@fixture.invalid`, hash, tipo, id);
    }
  }
  return password;
}
export function client(base, headers = {}) {
  let cookie = "",
    csrf = "";
  const call = async (path, method = "GET", body, extra = {}) => {
    const res = await fetch(base + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
        ...(cookie ? { Cookie: cookie } : {}),
        ...(csrf ? { "X-CSRF-Token": csrf } : {}),
        ...extra,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const set = res.headers.getSetCookie();
    if (set.length) cookie = set.map((x) => x.split(";")[0]).join("; ");
    const data = method === "HEAD" ? null : await res.json();
    if (data?.csrfToken) csrf = data.csrfToken;
    return { status: res.status, body: data, headers: res.headers };
  };
  call.login = async (email, senha) => {
    await call("/auth/me");
    return call("/auth/login", "POST", { email, senha });
  };
  return call;
}
export async function actors(db, base, password, headers = {}) {
  const cache = new Map();
  return async (path, method = "GET", body, extra = {}) => {
    let identity = "doador1";
    if (method !== "GET" && path !== "/doacoes") {
      let church = 1;
      if (path.startsWith("/doacoes/"))
        church =
          db
            .prepare("SELECT igreja_id FROM doacoes WHERE id=?")
            .get(Number(path.split("/")[2]))?.igreja_id || 1;
      else if (path.startsWith("/igrejas/"))
        church = Number(path.split("/")[2]);
      else if (path.startsWith("/campanhas/"))
        church =
          db
            .prepare("SELECT igreja_id FROM campanhas WHERE id=?")
            .get(Number(path.split("/")[2]))?.igreja_id || 1;
      else church = body?.igreja_id || 1;
      identity = "igreja" + church;
    }
    if (!cache.has(identity)) {
      const c = client(base, headers);
      const r = await c.login(identity + "@fixture.invalid", password);
      if (r.status !== 200)
        throw new Error("Fixture login: " + JSON.stringify(r));
      cache.set(identity, c);
    }
    return cache.get(identity)(path, method, body, extra);
  };
}
