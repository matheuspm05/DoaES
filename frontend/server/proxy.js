const MAX_BODY_BYTES = 100 * 1024;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const TIMEOUT_MS = 95000;
const readRoutes =
  /^(health|categorias|doadores-demo|igrejas(?:\/[1-9]\d*)?|campanhas(?:\/[1-9]\d*)?|doacoes(?:\/[1-9]\d*)?)$/;
const writeRoutes = {
  POST: /^(campanhas|doacoes)$/,
  PATCH:
    /^(igrejas\/[1-9]\d*|campanhas\/[1-9]\d*|doacoes\/[1-9]\d*\/(decisao|agendamento|concluir))$/,
};

class ProxyError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function proxyConfig(env) {
  const key = env.DEMO_API_KEY || "";
  if (key.length < 32 || key.length > 256 || /\s/.test(key))
    throw new ProxyError(503, "A conexão com a API ainda não foi configurada.");
  let upstream;
  try {
    upstream = new URL(env.RENDER_API_URL);
  } catch {
    throw new ProxyError(503, "A conexão com a API ainda não foi configurada.");
  }
  const local =
    env.NODE_ENV !== "production" &&
    ["127.0.0.1", "localhost"].includes(upstream.hostname) &&
    upstream.protocol === "http:";
  if (
    (upstream.protocol !== "https:" && !local) ||
    upstream.username ||
    upstream.password ||
    upstream.pathname !== "/" ||
    upstream.search ||
    upstream.hash
  )
    throw new ProxyError(503, "A conexão com a API ainda não foi configurada.");
  const origins = (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  // Estes domínios vêm do ambiente gerenciado pela Vercel, não do cabeçalho Host do cliente.
  for (const domain of [env.VERCEL_URL, env.VERCEL_PROJECT_PRODUCTION_URL])
    if (domain) origins.push(`https://${domain}`);
  const allowedOrigins = new Set();
  for (const value of origins) {
    let origin;
    try {
      origin = new URL(value);
    } catch {
      throw new ProxyError(503, "A origem do site ainda não foi configurada.");
    }
    if (
      origin.pathname !== "/" ||
      origin.username ||
      origin.password ||
      origin.search ||
      origin.hash ||
      !["http:", "https:"].includes(origin.protocol) ||
      (env.NODE_ENV === "production" && origin.protocol !== "https:")
    )
      throw new ProxyError(503, "A origem do site ainda não foi configurada.");
    allowedOrigins.add(origin.origin);
  }
  if (!allowedOrigins.size)
    throw new ProxyError(503, "A origem do site ainda não foi configurada.");
  return { key, upstream, allowedOrigins };
}

function getTarget(req, upstream) {
  const incoming = new URL(req.url, "https://proxy.invalid");
  const rewritten =
    incoming.pathname === "/api/proxy" || incoming.pathname === "/api/proxy.js";
  const supplied = incoming.searchParams.getAll("path");
  if (supplied.length > 1) throw new ProxyError(400, "Parâmetros inválidos.");
  const route = rewritten
    ? supplied[0]
    : incoming.pathname.replace(/^\/api\//, "");
  if (typeof route !== "string" || route.length > 120)
    throw new ProxyError(404, "Rota da API não encontrada.");
  if (!rewritten && supplied.length && supplied[0] !== route)
    throw new ProxyError(400, "Parâmetros inválidos.");
  const method = req.method || "GET";
  const valid = ["GET", "HEAD"].includes(method)
    ? readRoutes.test(route)
    : writeRoutes[method]?.test(route);
  if (!valid)
    throw new ProxyError(
      ["GET", "HEAD", "POST", "PATCH"].includes(method) ? 404 : 405,
      "Operação não disponível.",
    );
  const queryKeys =
    route === "doacoes"
      ? ["doador_demo_id", "igreja_id", "status"]
      : route === "campanhas"
        ? ["igreja_id", "ativa"]
        : [];
  const target = new URL(`/api/${route}`, upstream);
  for (const name of incoming.searchParams.keys()) {
    if (name === "path") continue;
    if (
      !queryKeys.includes(name) ||
      incoming.searchParams.getAll(name).length !== 1
    )
      throw new ProxyError(400, "Parâmetros inválidos.");
    target.searchParams.set(name, incoming.searchParams.get(name));
  }
  return target;
}

function validateOrigin(req, allowedOrigins) {
  const origin = req.headers.origin;
  const site = req.headers["sec-fetch-site"];
  if (site === "cross-site" || (origin && !allowedOrigins.has(origin)))
    throw new ProxyError(403, "Origem não permitida.");
  // Defesa contra escrita iniciada em outro site. Não equivale a autenticação de usuário.
  if (
    ["POST", "PATCH"].includes(req.method) &&
    (!origin || !allowedOrigins.has(origin))
  )
    throw new ProxyError(
      403,
      "A operação deve ser iniciada pela demonstração no site.",
    );
}

async function bodyFor(req) {
  if (!["POST", "PATCH"].includes(req.method)) return undefined;
  if (!/^application\/json(?:\s*;|$)/i.test(req.headers["content-type"] || ""))
    throw new ProxyError(415, "Envie os dados em JSON.");
  let body = req.body;
  if (body === undefined) {
    const chunks = [];
    let size = 0;
    let tooLarge = false;
    // Lê o stream também nos testes locais; na Vercel req.body normalmente já está preenchido.
    for await (const chunk of req) {
      size += Buffer.byteLength(chunk);
      if (size > MAX_BODY_BYTES) tooLarge = true;
      if (!tooLarge) chunks.push(Buffer.from(chunk));
    }
    if (tooLarge)
      throw new ProxyError(413, "Dados excedem o limite de 100 KB.");
    body = Buffer.concat(chunks).toString("utf8");
  }
  let serialized;
  try {
    serialized = typeof body === "string" ? body : JSON.stringify(body);
  } catch {
    throw new ProxyError(400, "JSON inválido.");
  }
  if (!serialized || Buffer.byteLength(serialized) > MAX_BODY_BYTES)
    throw new ProxyError(413, "Dados excedem o limite de 100 KB.");
  let parsed;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new ProxyError(400, "JSON inválido.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
    throw new ProxyError(400, "Envie um objeto JSON válido.");
  return serialized;
}

function send(res, status, body, head = false) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.end(head ? undefined : JSON.stringify(body));
}

export function createProxyHandler({
  env = process.env,
  fetchImpl = fetch,
} = {}) {
  return async function proxy(req, res) {
    try {
      const config = proxyConfig(env);
      validateOrigin(req, config.allowedOrigins);
      const target = getTarget(req, config.upstream);
      const body = await bodyFor(req);
      // Não repassa cookies, Authorization, Host, cabeçalhos de proxy ou chave enviada pelo visitante.
      const response = await fetchImpl(target, {
        method: req.method,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-Doaes-Key": config.key,
        },
        body,
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (req.method === "HEAD") return send(res, response.status, null, true);
      if (response.status >= 300 && response.status < 400)
        throw new ProxyError(
          502,
          "A API respondeu com um redirecionamento inesperado.",
        );
      const length = Number(response.headers.get("content-length") || 0);
      if (length > MAX_RESPONSE_BYTES)
        throw new ProxyError(
          502,
          "A resposta da API excedeu o limite da demonstração.",
        );
      if (!response.headers.get("content-type")?.includes("application/json"))
        throw new ProxyError(
          503,
          "A demonstração está iniciando ou temporariamente indisponível. Aguarde e tente novamente.",
        );
      const content = await response.text();
      if (Buffer.byteLength(content) > MAX_RESPONSE_BYTES)
        throw new ProxyError(
          502,
          "A resposta da API excedeu o limite da demonstração.",
        );
      let data;
      try {
        data = JSON.parse(content);
      } catch {
        throw new ProxyError(502, "A API não respondeu corretamente.");
      }
      const retry = response.headers.get("retry-after");
      if (retry && /^\d{1,5}$/.test(retry)) res.setHeader("Retry-After", retry);
      send(res, response.status, data);
    } catch (error) {
      const status = error instanceof ProxyError ? error.status : 503;
      const message =
        error instanceof ProxyError
          ? error.message
          : "A demonstração está iniciando ou temporariamente indisponível. Aguarde e tente novamente.";
      send(res, status, { erro: message }, req.method === "HEAD");
    }
  };
}
