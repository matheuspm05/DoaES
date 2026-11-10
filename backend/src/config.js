export function readConfig(env = process.env) {
  const production = env.NODE_ENV === "production";
  const port = Number(env.PORT || 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("PORT deve ser uma porta entre 1 e 65535.");
  const apiKey = env.DEMO_API_KEY || "";
  if (
    (production || apiKey) &&
    (apiKey.length < 32 || apiKey.length > 256 || /\s/.test(apiKey))
  ) {
    throw new Error(
      "Configure DEMO_API_KEY com 32 a 256 caracteres sem espaços. Nunca use prefixo VITE_ para esse segredo.",
    );
  }
  const configuredOrigins =
    env.ALLOWED_ORIGINS ||
    (production ? "" : "http://localhost:5173,http://127.0.0.1:5173");
  const allowedOrigins = configuredOrigins
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => {
      const url = new URL(value);
      if (
        url.username ||
        url.password ||
        url.search ||
        url.hash ||
        url.pathname !== "/" ||
        !["http:", "https:"].includes(url.protocol) ||
        (production && url.protocol !== "https:")
      ) {
        throw new Error(
          "ALLOWED_ORIGINS deve conter origens exatas, sem caminhos ou curingas; use HTTPS em produção.",
        );
      }
      return url.origin;
    });
  const rateLimit = Number(env.API_RATE_LIMIT || 600);
  if (!Number.isInteger(rateLimit) || rateLimit < 1 || rateLimit > 10000)
    throw new Error("API_RATE_LIMIT deve ser um inteiro entre 1 e 10000.");
  return {
    production,
    port,
    host: "0.0.0.0",
    apiKey,
    allowedOrigins,
    rateLimit,
  };
}
