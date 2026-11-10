import { createHash, timingSafeEqual } from "node:crypto";
import { ApiError } from "../utils/errors.js";

const digest = (value) => createHash("sha256").update(value).digest();
const isHealth = (req) =>
  req.path === "/health" && ["GET", "HEAD"].includes(req.method);

export function apiAccess(config) {
  const expected = config.apiKey ? digest(config.apiKey) : null;
  return (req, _res, next) => {
    if (isHealth(req) || !expected) return next();
    const supplied = req.get("x-doaes-key") || "";
    if (!timingSafeEqual(digest(supplied), expected))
      return next(new ApiError(401, "Acesso direto à API não autorizado."));
    next();
  };
}

export function apiRateLimit({ rateLimit }) {
  const visitors = new Map();
  const windowMs = 60000;
  return (req, res, next) => {
    if (isHealth(req) || req.method === "OPTIONS") return next();
    const now = Date.now();
    for (const [key, value] of visitors)
      if (value.reset <= now) visitors.delete(key);
    const key = req.ip || "unknown";
    const current = visitors.get(key) || { count: 0, reset: now + windowMs };
    if (
      (!visitors.has(key) && visitors.size >= 1000) ||
      current.count >= rateLimit
    ) {
      res.setHeader(
        "Retry-After",
        Math.max(1, Math.ceil((current.reset - now) / 1000)),
      );
      return next(
        new ApiError(
          429,
          "Muitas solicitações. Aguarde um minuto e tente novamente.",
        ),
      );
    }
    current.count += 1;
    visitors.set(key, current);
    next();
  };
}
