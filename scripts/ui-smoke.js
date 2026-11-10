import { chromium } from "playwright-core";
import assert from "node:assert/strict";
import { mkdirSync, existsSync } from "node:fs";
import { createDatabase } from "../backend/src/database/index.js";
import { seed } from "../backend/src/database/seed.js";
import { createApp } from "../backend/src/app.js";
import { today } from "../backend/src/utils/dates.js";

// Usa o navegador já instalado, sem baixar browser e sem tocar no banco da demo.
const executablePath =
  process.env.BROWSER_PATH ||
  [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  ].find(existsSync);
if (!executablePath)
  throw new Error("Defina BROWSER_PATH com o caminho de Chrome ou Edge.");
mkdirSync("test-results", { recursive: true });
const db = createDatabase(":memory:");
seed(db);
const server = createApp(db).listen(0, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));
let browser;
const errors = [];
const postBodies = [];
let count = 0;
try {
  browser = await chromium.launch({ executablePath, headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
  });
  await context.route(
    (url) => url.pathname.startsWith("/api/"),
    async (route) => {
      const url = new URL(route.request().url());
      const response = await route.fetch({
        url: `http://127.0.0.1:${server.address().port}${url.pathname}${url.search}`,
      });
      if (
        url.pathname === "/api/doacoes" &&
        route.request().method() === "POST"
      )
        postBodies.push(route.request().postDataJSON());
      await route.fulfill({ response });
    },
  );
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("requestfailed", (request) => {
    if (
      new URL(request.url()).pathname === "/favicon.svg" &&
      request.failure()?.errorText === "net::ERR_ABORTED"
    )
      return;
    errors.push(`${request.url()}: ${request.failure()?.errorText}`);
  });
  async function visit(path, title) {
    await page.goto(`http://localhost:5173${path}`);
    const heading = page.locator("#conteudo h1");
    await (title ? heading.filter({ hasText: title }) : heading)
      .first()
      .waitFor();
    await page.evaluate(() => document.fonts.ready);
    count++;
  }
  async function noOverflow() {
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      `Overflow: ${page.url()} em ${(await page.viewportSize()).width}px`,
    );
  }
  await visit("/", /Doações que/);
  await noOverflow();
  await page.screenshot({
    path: "test-results/desktop-inicio.png",
    fullPage: true,
  });
  assert.equal(await page.locator(".landing-page main section").count(), 3);
  for (const image of await page.locator(".landing-page img").all()) {
    await image.evaluate((img) => img.decode());
    assert.ok(await image.evaluate((img) => img.naturalWidth > 0));
  }
  await page
    .getByLabel("Nome fictício", { exact: true })
    .fill("Visitante Demo");
  await page
    .getByLabel("E-mail de exemplo", { exact: true })
    .fill("teste@exemplo.invalid");
  await page
    .getByLabel("Sua mensagem demonstrativa")
    .fill("Mensagem fictícia para conhecer o projeto.");
  await page.getByRole("button", { name: "Simular envio" }).click();
  await page
    .getByRole("status")
    .filter({ hasText: "Simulação concluída!" })
    .waitFor();
  assert.equal(postBodies.length, 0);
  await visit("/cadastro/doador", /Seu próximo gesto/);
  await visit("/cadastro/igreja", /Juntos/);
  await visit("/entrar", /Cada doação/);
  await page.getByRole("button", { name: "Entrar como doador" }).click();
  await page.getByRole("heading", { name: /Olá, Ana/ }).waitFor();
  const donorPages = [
    ["/doador", /Olá, Ana/],
    ["/igrejas", /Boas causas/],
    ["/igrejas/1", /Semente/],
    ["/campanhas", /Uma causa/],
    ["/campanhas/1", /abraço/],
    ["/doador/acompanhar", /Acompanhar/],
    ["/doador/historico", /histórico/],
    ["/doador/perfil", /perfil/],
    ["/doador/doacoes/3", /boas mãos/],
  ];
  for (const [path, title] of donorPages) {
    await visit(path, title);
    await noOverflow();
  }
  await visit("/doador/nova-doacao?igreja=1", /Vamos fazer/);
  await page.screenshot({
    path: "test-results/desktop-nova-doacao.png",
    fullPage: true,
  });
  await page.getByLabel("Igreja destinatária").selectOption("2");
  assert.equal(await page.locator('input[value="COLETA"]').count(), 0);
  await page.getByLabel("Igreja destinatária").selectOption("1");
  await page.getByLabel("Categoria *", { exact: true }).selectOption("3");
  await page
    .getByLabel("Descrição *", { exact: true })
    .fill("Arroz não perecível — teste da interface");
  await page.getByRole("button", { name: "Revisar doação" }).click();
  assert.equal(await page.locator('input[type="date"]:invalid').count(), 1);
  assert.match(await page.locator(".step-pill").innerText(), /ETAPA 1/);
  await page.getByLabel("Validade do alimento").fill("2028-12-31");
  await page.getByLabel("Fotos demonstrativas").setInputFiles({
    name: "foto-demo.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jV1sAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  assert.equal(await page.locator(".photo-grid img").count(), 1);
  await page.getByRole("button", { name: "Adicionar outro item" }).click();
  await page
    .getByLabel("Descrição *", { exact: true })
    .nth(1)
    .fill("Camisetas limpas — teste da interface");
  await page.getByRole("radio", { name: /Coleta pela igreja/ }).check();
  await page.getByRole("button", { name: "Revisar doação" }).click();
  await page
    .getByRole("heading", { name: "Está tudo certo para compartilhar?" })
    .waitFor();
  await page.getByRole("button", { name: "Enviar minha doação" }).click();
  await page.waitForURL(/\/doador\/doacoes\/\d+$/);
  const donationId = Number(page.url().split("/").at(-1));
  assert.equal(postBodies.length, 1);
  assert.equal(postBodies[0].itens.length, 2);
  assert.ok(!JSON.stringify(postBodies[0]).includes("foto"));
  assert.match(await page.locator(".page-head .badge").innerText(), /Pendente/);
  await page.getByLabel("Perfil de demonstração").selectOption("igreja");
  await page.waitForURL(/\/igreja$/);
  const churchPages = [
    ["/igreja", /Painel da igreja/],
    ["/igreja/configuracoes", /Perfil e condições/],
    ["/igreja/campanhas", /Suas campanhas/],
    ["/igreja/campanhas/nova", /Uma nova campanha/],
    ["/igreja/campanhas/1/editar", /Cuidar/],
    ["/igreja/solicitacoes", /Solicitações/],
    ["/igreja/agendamentos", /Agendamentos/],
  ];
  for (const [path, title] of churchPages) {
    await visit(path, title);
    await noOverflow();
  }
  await visit(`/igreja/solicitacoes/${donationId}`, /solicitação/);
  await page.getByRole("button", { name: "Aceitar doação" }).click();
  await page.waitForURL(/\/agendar$/);
  await page.getByLabel("Data combinada").fill(today());
  await page.getByRole("button", { name: "Salvar agendamento" }).click();
  await page.getByRole("button", { name: "Confirmar recebimento" }).waitFor();
  await page.getByRole("button", { name: "Confirmar recebimento" }).click();
  await page
    .getByRole("heading", { name: "Um gesto que chegou ao destino." })
    .waitFor();
  await page.getByLabel("Perfil de demonstração").selectOption("doador");
  await page.waitForURL(/\/doador$/);
  await visit(`/doador/doacoes/${donationId}`, /boas mãos/);
  assert.match(
    await page.locator(".page-head .badge").innerText(),
    /Concluída/,
  );
  await page.setViewportSize({ width: 375, height: 812 });
  for (const path of [
    "/",
    "/entrar",
    "/doador",
    "/igrejas",
    "/campanhas",
    "/doador/nova-doacao",
    "/doador/perfil",
    `/doador/doacoes/${donationId}`,
  ]) {
    await visit(path);
    await noOverflow();
    if (["/", "/doador", "/doador/nova-doacao"].includes(path))
      await page.screenshot({
        path: `test-results/mobile-${path === "/" ? "inicio" : path.split("/").at(-1)}.png`,
        fullPage: true,
      });
    if (path === "/") {
      await page
        .getByRole("button", { name: "Abrir menu", exact: true })
        .click();
      await page
        .getByRole("navigation", { name: "Principal", exact: true })
        .getByRole("link", { name: "Contato", exact: true })
        .click();
      await page
        .locator(".landing-navigation.is-open")
        .waitFor({ state: "hidden" });
      await noOverflow();
    }
  }
  await visit("/doador");
  await page.getByRole("button", { name: "Abrir menu", exact: true }).click();
  await page
    .getByRole("navigation", { name: "Painel", exact: true })
    .getByRole("link", { name: "Histórico" })
    .click();
  await page.waitForURL(/historico$/);
  assert.ok(
    !(await page
      .locator(".sidebar")
      .evaluate((el) => el.classList.contains("open"))),
  );
  await page.getByLabel("Perfil de demonstração").selectOption("igreja");
  await page.waitForURL(/\/igreja$/);
  for (const path of [
    "/igreja",
    "/igreja/solicitacoes",
    "/igreja/configuracoes",
    "/igreja/campanhas/nova",
    `/igreja/solicitacoes/${donationId}`,
  ]) {
    await visit(path);
    await noOverflow();
  }
  await page.screenshot({
    path: "test-results/mobile-recebimento.png",
    fullPage: true,
  });
  for (const width of [320, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await visit("/", /Doações que/);
    await noOverflow();
    await page.screenshot({
      path: `test-results/landing-${width}.png`,
      fullPage: true,
    });
  }
  assert.deepEqual(errors, []);
  console.log(
    `Interface verificada: ${count} visitas, desktop 1440px e mobile 375px; landing também em 320px e 768px. Ciclo completo, contato simulado, validade, coleta, fotos locais e menus móveis. Sem erros JavaScript.`,
  );
} catch (error) {
  const page = browser?.contexts()[0]?.pages()[0];
  if (page) {
    await page.screenshot({
      path: "test-results/falha-interface.png",
      fullPage: true,
    });
    console.error(
      "Página na falha:",
      page.url(),
      "Erros JS:",
      errors,
      "\n",
      (await page.locator("body").innerText()).slice(-2000),
    );
  }
  throw error;
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
  db.close();
}
