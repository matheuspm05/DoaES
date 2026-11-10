import { requireValue } from "./errors.js";

export function text(value, label, required = true, max = 2000) {
  requireValue(
    ((value === undefined || value === null) && !required) ||
      typeof value === "string",
    `${label}: informe um texto.`,
  );
  const result = (value ?? "").trim();
  requireValue(!required || result.length > 0, `${label} é obrigatório.`);
  requireValue(result.length <= max, `${label}: máximo de ${max} caracteres.`);
  return result;
}
export function id(value, label = "Identificador") {
  const number = Number(value);
  requireValue(
    Number.isSafeInteger(number) && number > 0,
    `${label} inválido.`,
  );
  return number;
}
