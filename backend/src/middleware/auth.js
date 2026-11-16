import { timingSafeEqual, createHmac } from "node:crypto";
import { random, digest, account } from "../services/auth.js";
import { ApiError, requireValue } from "../utils/errors.js";
export function sessionMiddleware(db, config) {
  let secret = config.sessionSecret;
  if (!secret) {
    db.prepare("INSERT OR IGNORE INTO configuracao_local VALUES (?,?)").run(
      "session_secret",
      random(),
    );
    secret = db
      .prepare("SELECT valor FROM configuracao_local WHERE chave=?")
      .get("session_secret").valor;
  }
  const sign = (token) =>
    createHmac("sha256", secret).update(token).digest("hex");
  return (req, res, next) => {
    db.prepare("DELETE FROM sessoes WHERE expira < ?").run(Date.now());
    const raw =
      (req.headers.cookie || "")
        .split(";")
        .map((x) => x.trim())
        .find((x) => x.startsWith("doaes.sid="))
        ?.slice(10) || "";
    const [token, signature] = raw.split(".");
    const valid =
      /^[a-f0-9]{64}\.[a-f0-9]{64}$/.test(raw) &&
      token &&
      signature &&
      /^[a-f0-9]{64}$/.test(token) &&
      /^[a-f0-9]{64}$/.test(signature) &&
      timingSafeEqual(Buffer.from(signature), Buffer.from(sign(token)));
    req.session = valid
      ? db
          .prepare("SELECT * FROM sessoes WHERE id=? AND expira>?")
          .get(digest(token), Date.now())
      : null;
    req.user = req.session?.usuario_id
      ? account(db, req.session.usuario_id)
      : null;
    req.rotateSession = (userId = null) => {
      if (req.session)
        db.prepare("DELETE FROM sessoes WHERE id=?").run(req.session.id);
      const value = random(),
        csrf = random(),
        expira = Date.now() + 8 * 60 * 60 * 1000;
      const id = digest(value);
      db.prepare("INSERT INTO sessoes VALUES (?,?,?,?)").run(
        id,
        userId,
        csrf,
        expira,
      );
      req.session = { id, usuario_id: userId, csrf, expira };
      res.setHeader(
        "Set-Cookie",
        `doaes.sid=${value}.${sign(value)}; Path=/api; HttpOnly; SameSite=Lax; Max-Age=28800${config.production ? "; Secure" : ""}`,
      );
      req.user = userId ? account(db, userId) : null;
    };
    next();
  };
}
export function requireAuth(req, _res, next) {
  if (!req.user) return next(new ApiError(401, "Faça login para continuar."));
  next();
}
export const role = (tipo) => (req, res, next) =>
  requireAuth(req, res, () =>
    req.user.tipo === tipo
      ? next()
      : next(new ApiError(403, "Acesso não permitido.")),
  );
export function csrf(req, _res, next) {
  if (!["POST", "PATCH", "DELETE", "PUT"].includes(req.method)) return next();
  if (!req.session || req.get("X-CSRF-Token") !== req.session.csrf)
    return next(
      new ApiError(
        403,
        "Sessão de formulário inválida. Atualize a página e tente novamente.",
      ),
    );
  next();
}
export function ownChurch(req, churchId) {
  requireValue(
    req.user?.tipo === "IGREJA" && req.user.igreja_id === Number(churchId),
    "Acesso não permitido.",
    403,
  );
}
export function ownDonation(db, req, id, write = false) {
  const d = db
    .prepare("SELECT igreja_id,doador_demo_id FROM doacoes WHERE id=?")
    .get(id);
  requireValue(d, "Doação não encontrada.", 404);
  const allowed =
    req.user &&
    ((req.user.tipo === "IGREJA" && req.user.igreja_id === d.igreja_id) ||
      (!write &&
        req.user.tipo === "DOADOR" &&
        req.user.doador_id === d.doador_demo_id));
  requireValue(allowed, "Acesso não permitido.", 403);
}
