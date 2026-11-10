import { requireValue } from "../utils/errors.js";

export function validateJson(req, _res, next) {
  if (["POST", "PATCH"].includes(req.method)) {
    requireValue(
      req.body && typeof req.body === "object" && !Array.isArray(req.body),
      "Envie um objeto JSON válido.",
    );
  }
  next();
}
