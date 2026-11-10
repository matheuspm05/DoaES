import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import {
  mkdtempSync,
  rmSync,
  existsSync,
  readdirSync,
  readFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { createRequire } from "node:module";
import { chromium } from "playwright-core";
import { createDatabase } from "../backend/src/database/index.js";
import { seed } from "../backend/src/database/seed.js";
import { createApp } from "../backend/src/app.js";
import { readConfig } from "../backend/src/config.js";
import { today } from "../backend/src/utils/dates.js";
import { createProxyHandler } from "../frontend/server/proxy.js";

const origin = "https://doaes.example";
const key = randomBytes(32).toString("hex");
const production = () =>
  readConfig({
    NODE_ENV: "production",
    DEMO_API_KEY: key,
    ALLOWED_ORIGINS: origin,
  });
async function listen(server) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return `http://127.0.0.1:${server.address().port}`;
}
async function close(server) {
  await new Promise((resolve) => server.close(resolve));
}
async function json(url, method = "GET", body, headers = {}) {
  const response = await fetch(url, {
    method,
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: "manual",
  });
  return {
    status: response.status,
    headers: response.headers,
    body: method === "HEAD" ? null : await response.json(),
  };
}

test("configuração de produção falha de forma fechada e aceita PORT do Render", () => {
  assert.throws(() => readConfig({ NODE_ENV: "production" }), /DEMO_API_KEY/);
  assert.throws(
    () => readConfig({ NODE_ENV: "production", DEMO_API_KEY: "curta" }),
    /DEMO_API_KEY/,
  );
  assert.throws(() => readConfig({ PORT: "abc" }), /PORT/);
  assert.throws(
    () =>
      readConfig({
        NODE_ENV: "production",
        DEMO_API_KEY: key,
        ALLOWED_ORIGINS: "http://inseguro.example",
      }),
    /HTTPS/,
  );
  assert.throws(
    () => readConfig({ ALLOWED_ORIGINS: "https://exemplo.invalid/caminho" }),
    /ALLOWED_ORIGINS/,
  );
  const config = readConfig({
    NODE_ENV: "production",
    PORT: "10000",
    DEMO_API_KEY: key,
  });
  assert.equal(config.port, 10000);
  assert.equal(config.host, "0.0.0.0");
  assert.deepEqual(config.allowedOrigins, []);
  assert.equal(readConfig({}).apiKey, "");
});

test("API protegida: chave, origem, preflight, headers e limite de requisições", async (t) => {
  const db = createDatabase(":memory:");
  seed(db);
  const server = createServer(createApp(db, production()));
  const base = await listen(server);
  t.after(async () => {
    await close(server);
    db.close();
  });
  assert.equal((await json(base + "/api/health")).status, 200);
  for (const method of ["GET", "POST", "PATCH"]) {
    const path =
      method === "GET"
        ? "/api/igrejas"
        : method === "POST"
          ? "/api/doacoes"
          : "/api/igrejas/1";
    assert.equal(
      (await json(base + path, method, method === "GET" ? undefined : {}))
        .status,
      401,
    );
  }
  assert.equal(
    (
      await json(base + "/api/igrejas", "GET", undefined, {
        "X-Doaes-Key": "errada",
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await json(base + "/api/igrejas", "GET", undefined, {
        "X-Doaes-Key": key,
      })
    ).body.length,
    3,
  );
  const allowed = await json(base + "/api/igrejas", "GET", undefined, {
    "X-Doaes-Key": key,
    Origin: origin,
  });
  assert.equal(allowed.headers.get("access-control-allow-origin"), origin);
  assert.equal(allowed.headers.get("cache-control"), "no-store");
  assert.equal(allowed.headers.get("x-content-type-options"), "nosniff");
  assert.equal(
    (
      await json(base + "/api/igrejas", "GET", undefined, {
        "X-Doaes-Key": key,
        Origin: "https://outro.example",
      })
    ).status,
    403,
  );
  const preflight = await fetch(base + "/api/doacoes", {
    method: "OPTIONS",
    headers: {
      Origin: origin,
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type",
    },
  });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get("access-control-allow-origin"), origin);
  const limited = createApp(db, { ...production(), rateLimit: 1 }),
    limitedServer = limited.listen(0, "127.0.0.1");
  await once(limitedServer, "listening");
  try {
    const url = `http://127.0.0.1:${limitedServer.address().port}/api/igrejas`;
    assert.equal(
      (await json(url, "GET", undefined, { "X-Doaes-Key": key })).status,
      200,
    );
    const blocked = await json(url, "GET", undefined, { "X-Doaes-Key": key });
    assert.equal(blocked.status, 429);
    assert.ok(blocked.headers.get("retry-after"));
  } finally {
    await close(limitedServer);
  }
});

test("proxy Vercel → API Render: ciclo completo, filtros e restrições sem segredo no navegador", async (t) => {
  const db = createDatabase(":memory:");
  seed(db);
  const backend = createServer(createApp(db, production()));
  const upstream = await listen(backend);
  const received = [];
  const proxy = createProxyHandler({
    env: {
      NODE_ENV: "test",
      RENDER_API_URL: upstream,
      DEMO_API_KEY: key,
      ALLOWED_ORIGINS: origin,
    },
    fetchImpl: (url, options) => {
      received.push(options.headers);
      return fetch(url, options);
    },
  });
  const gateway = createServer(proxy);
  const site = await listen(gateway);
  t.after(async () => {
    await close(gateway);
    await close(backend);
    db.close();
  });
  const call = (path, method = "GET", body, extra = {}) =>
    json(site + path, method, body, { Origin: origin, ...extra });
  assert.equal((await call("/api/proxy?path=igrejas")).body.length, 3);
  assert.equal((await call("/api/categorias")).body.length, 4);
  assert.equal((await call("/api/doadores-demo")).body.length, 2);
  assert.equal(
    (await call("/api/campanhas?igreja_id=1&ativa=true")).body.length,
    2,
  );
  assert.equal(
    (await call("/api/doacoes?doador_demo_id=1&status=PENDENTE")).body.length,
    1,
  );
  const payload = {
    igreja_id: 1,
    doador_demo_id: 1,
    modalidade: "ENTREGA",
    itens: [
      {
        categoria_id: 3,
        descricao: "Arroz fictício de teste",
        quantidade: 2,
        condicao: "NOVO",
        validade: "2028-12-31",
      },
    ],
  };
  assert.equal(
    (
      await call("/api/doacoes", "POST", {
        ...payload,
        itens: [{ ...payload.itens[0], validade: null }],
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await call("/api/doacoes", "POST", {
        ...payload,
        igreja_id: 2,
        modalidade: "COLETA",
        endereco_coleta_ficticio: "Rua fictícia",
      })
    ).status,
    400,
  );
  const created = await call("/api/doacoes", "POST", payload, {
    "X-Doaes-Key": "chave-injetada-pelo-visitante",
    Cookie: "nao-repassar=1",
    Authorization: "Bearer nao-repassar",
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.status, "PENDENTE");
  const id = created.body.id;
  assert.equal(
    (
      await call(`/api/doacoes/${id}/agendamento`, "PATCH", {
        data: today(),
        periodo: "MANHA",
      })
    ).status,
    409,
  );
  assert.equal(
    (await call(`/api/doacoes/${id}/decisao`, "PATCH", { status: "ACEITA" }))
      .body.status,
    "ACEITA",
  );
  assert.equal(
    (
      await call(`/api/doacoes/${id}/agendamento`, "PATCH", {
        data: today(),
        periodo: "MANHA",
      })
    ).status,
    200,
  );
  assert.equal(
    (await call(`/api/doacoes/${id}/concluir`, "PATCH", {})).body.status,
    "CONCLUIDA",
  );
  const result = await call("/api/doacoes?doador_demo_id=1");
  assert.equal(result.body.find((d) => d.id === id).status, "CONCLUIDA");
  const campaign = await call("/api/campanhas", "POST", {
    igreja_id: 1,
    titulo: "Teste fictício no deploy",
    descricao: "Exemplo",
    categoria_id: 1,
    ativa: true,
  });
  assert.equal(campaign.status, 201);
  assert.equal(
    (
      await call(`/api/campanhas/${campaign.body.id}`, "PATCH", {
        ativa: false,
      })
    ).body.ativa,
    false,
  );
  assert.equal(
    (
      await call("/api/igrejas/1", "PATCH", {
        descricao: "Descrição fictícia atualizada pelo proxy.",
      })
    ).status,
    200,
  );
  assert.ok(
    received.every(
      (headers) =>
        headers["X-Doaes-Key"] === key &&
        !headers.Cookie &&
        !headers.Authorization &&
        !headers.Origin,
    ),
  );
  assert.ok(!JSON.stringify(result.body).includes(key));
  assert.equal(
    (
      await call("/api/doacoes", "POST", payload, {
        Origin: "https://invasor.example",
      })
    ).status,
    403,
  );
  assert.equal(
    (await json(site + "/api/doacoes", "POST", payload)).status,
    403,
  );
  assert.equal(
    (
      await call("/api/igrejas", "GET", undefined, {
        "Sec-Fetch-Site": "cross-site",
      })
    ).status,
    403,
  );
  assert.equal((await call("/api/https://invasor.example")).status, 404);
  assert.equal(
    (await call("/api/proxy?path=igrejas&path=doacoes")).status,
    400,
  );
  assert.equal(
    (await call("/api/igrejas?url=https://invasor.example")).status,
    400,
  );
  assert.equal((await call("/api/igrejas", "DELETE")).status, 405);
  const tooLarge = await call("/api/doacoes", "POST", {
    ...payload,
    extra: "x".repeat(110000),
  });
  assert.equal(tooLarge.status, 413);
  const malformed = await fetch(site + "/api/doacoes", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: "{",
  });
  assert.equal(malformed.status, 400);
  const plain = await fetch(site + "/api/doacoes", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "text/plain" },
    body: "{}",
  });
  assert.equal(plain.status, 415);
});

test("proxy fecha sem configuração e trata timeout, redirecionamento e cold start sem vazar segredos", async (t) => {
  const handlers = [
    {
      env: {},
      fetchImpl: () => assert.fail("não deveria chamar upstream"),
      status: 503,
    },
    {
      env: {
        NODE_ENV: "production",
        RENDER_API_URL: "http://inseguro.example",
        DEMO_API_KEY: key,
        ALLOWED_ORIGINS: origin,
      },
      status: 503,
    },
    {
      fetchImpl: async () =>
        new Response("iniciando", {
          status: 503,
          headers: { "Content-Type": "text/html" },
        }),
      status: 503,
    },
    {
      fetchImpl: async () =>
        new Response("", {
          status: 302,
          headers: { Location: "https://outro.example" },
        }),
      status: 502,
    },
    {
      fetchImpl: async () => {
        throw new Error("falha interna " + key);
      },
      status: 503,
    },
  ];
  for (const item of handlers) {
    const env = item.env ?? {
      RENDER_API_URL: "https://api.example",
      DEMO_API_KEY: key,
      ALLOWED_ORIGINS: origin,
    };
    const server = createServer(
      createProxyHandler({ env, fetchImpl: item.fetchImpl }),
    );
    const url = await listen(server);
    t.after(() => close(server));
    const response = await json(url + "/api/igrejas");
    assert.equal(response.status, item.status);
    assert.ok(!JSON.stringify(response.body).includes(key));
  }
});

test("server.js usa PORT/0.0.0.0, seed automático e SQLite efêmero sem apagar dados a cada restart", async () => {
  const folder = mkdtempSync(join(tmpdir(), "doaes-render-")),
    file = join(folder, "demo.sqlite");
  const entry = resolve("backend/src/server.js");
  let child;
  async function stop() {
    if (child && child.exitCode === null) {
      child.kill();
      await once(child, "exit");
    }
    child = null;
  }
  async function start() {
    const reservation = createServer();
    const reserved = await listen(reservation);
    const port = new URL(reserved).port;
    await close(reservation);
    child = spawn(process.execPath, [entry], {
      env: {
        ...process.env,
        NODE_ENV: "production",
        PORT: port,
        DEMO_API_KEY: key,
        SQLITE_PATH: file,
        ALLOWED_ORIGINS: origin,
      },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let errors = "";
    child.stderr.on("data", (chunk) => {
      errors += chunk;
    });
    const url = `http://127.0.0.1:${port}`;
    for (let attempt = 0; attempt < 100; attempt++) {
      try {
        if ((await json(url + "/api/health")).status === 200) return url;
      } catch {
        /* Aguardar bind da porta. */
      }
      if (child.exitCode !== null)
        throw new Error(errors || "Servidor não iniciou.");
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    throw new Error("Servidor não respondeu na porta configurada.");
  }
  try {
    const failed = spawnSync(process.execPath, [entry], {
      env: {
        ...process.env,
        NODE_ENV: "production",
        DEMO_API_KEY: "",
        SQLITE_PATH: file,
      },
      windowsHide: true,
    });
    assert.notEqual(failed.status, 0);
    assert.equal(existsSync(file), false);
    let url = await start();
    const headers = { "X-Doaes-Key": key };
    assert.equal(
      (await json(url + "/api/doacoes", "GET", undefined, headers)).body.length,
      6,
    );
    const payload = {
      igreja_id: 1,
      doador_demo_id: 1,
      modalidade: "ENTREGA",
      itens: [
        {
          categoria_id: 1,
          descricao: "Item fictício preservado",
          quantidade: 1,
          condicao: "NOVO",
        },
      ],
    };
    assert.equal(
      (await json(url + "/api/doacoes", "POST", payload, headers)).status,
      201,
    );
    await stop();
    url = await start();
    assert.equal(
      (await json(url + "/api/doacoes", "GET", undefined, headers)).body.length,
      7,
    );
    await stop();
    rmSync(file);
    url = await start();
    assert.equal(
      (await json(url + "/api/doacoes", "GET", undefined, headers)).body.length,
      6,
    );
  } finally {
    await stop();
    rmSync(folder, { recursive: true, force: true });
  }
});

test("build Vite de produção não inclui as credenciais do servidor", () => {
  const result = spawnSync(
    process.execPath,
    [resolve("frontend/node_modules/vite/bin/vite.js"), "build"],
    {
      cwd: resolve("frontend"),
      env: {
        ...process.env,
        NODE_ENV: "production",
        DEMO_API_KEY: key,
        RENDER_API_URL: "https://backend-sentinel.example",
      },
      encoding: "utf8",
      windowsHide: true,
    },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const files = readdirSync("frontend/dist/assets").filter((file) =>
    file.endsWith(".js"),
  );
  assert.ok(files.length > 0);
  for (const file of files) {
    const content = readFileSync(join("frontend/dist/assets", file), "utf8");
    assert.ok(!content.includes(key));
    assert.ok(!content.includes("backend-sentinel.example"));
  }
});

test("frontend compilado navega pelo proxy protegido e conclui doação sem chave no navegador", async (t) => {
  const executablePath =
    process.env.BROWSER_PATH ||
    [
      "C:/Program Files/Google/Chrome/Application/chrome.exe",
      "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    ].find(existsSync);
  if (!executablePath) {
    t.skip(
      "Chrome/Edge não disponível; testes HTTP do proxy continuam obrigatórios.",
    );
    return;
  }
  const require = createRequire(
    new URL("../backend/package.json", import.meta.url),
  );
  const express = require("express");
  const db = createDatabase(":memory:");
  seed(db);
  const backend = createServer(createApp(db, production()));
  const upstream = await listen(backend);
  const env = { NODE_ENV: "test", RENDER_API_URL: upstream, DEMO_API_KEY: key };
  const proxy = createProxyHandler({ env });
  const app = express();
  app.use((req, res, next) =>
    req.path.startsWith("/api/") ? proxy(req, res) : next(),
  );
  app.use(express.static(resolve("frontend/dist")));
  app.use((_req, res) => res.sendFile(resolve("frontend/dist/index.html")));
  const gateway = createServer(app);
  const site = await listen(gateway);
  env.ALLOWED_ORIGINS = site;
  let browser;
  try {
    browser = await chromium.launch({ executablePath, headless: true });
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
      locale: "pt-BR",
      timezoneId: "America/Sao_Paulo",
    });
    const errors = [],
      requests = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => {
      if (new URL(request.url()).pathname.startsWith("/api/"))
        requests.push(request);
    });
    await page.goto(site + "/entrar");
    await page.getByRole("button", { name: "Entrar como doador" }).click();
    await page.waitForURL(/\/doador$/);
    await page.goto(site + "/doador/nova-doacao?igreja=1");
    await page
      .getByLabel("Descrição *", { exact: true })
      .fill("Item fictício pelo frontend compilado");
    await page.getByRole("button", { name: "Revisar doação" }).click();
    await page.getByRole("button", { name: "Enviar minha doação" }).click();
    await page.waitForURL(/\/doador\/doacoes\/\d+$/);
    const id = page.url().split("/").at(-1);
    assert.match(
      await page.locator(".page-head .badge").innerText(),
      /Pendente/,
    );
    await page.getByLabel("Perfil de demonstração").selectOption("igreja");
    await page.waitForURL(/\/igreja$/);
    await page.goto(site + `/igreja/solicitacoes/${id}`);
    await page.getByRole("button", { name: "Aceitar doação" }).click();
    await page.waitForURL(/\/agendar$/);
    await page.getByLabel("Data combinada").fill(today());
    await page.getByRole("button", { name: "Salvar agendamento" }).click();
    await page.getByRole("button", { name: "Confirmar recebimento" }).click();
    await page
      .getByRole("heading", { name: "Um gesto que chegou ao destino." })
      .waitFor();
    await page.getByLabel("Perfil de demonstração").selectOption("doador");
    await page.waitForURL(/\/doador$/);
    await page.goto(site + `/doador/doacoes/${id}`);
    await page.locator(".page-head .badge").waitFor();
    assert.match(
      await page.locator(".page-head .badge").innerText(),
      /Concluída/,
    );
    assert.ok(
      requests.filter((request) => ["POST", "PATCH"].includes(request.method()))
        .length >= 4,
    );
    assert.ok(
      requests.every(
        (request) =>
          !request.headers()["x-doaes-key"] && !request.headers().authorization,
      ),
    );
    assert.deepEqual(errors, []);
  } finally {
    if (browser) await browser.close();
    await close(gateway);
    await close(backend);
    db.close();
  }
});
