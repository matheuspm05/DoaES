import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { today } from "../../backend/src/utils/dates.js";

// Exercise registration in the browser, not by inserting or impersonating fixtures.
export async function newAccountsCycle(context, site) {
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", async (r) => {
    if (r.status() >= 400 && r.url().includes("/api/"))
      console.error("API:", r.status(), r.url(), await r.text());
  });
  try {
    const senha = randomBytes(16).toString("hex");
    const emails = {
      doador: "novo-doador@browser.invalid",
      igreja: "nova-igreja@browser.invalid",
    };
    async function exit() {
      if (await page.getByRole("button", { name: "Sair da conta" }).count()) {
        await page.getByRole("button", { name: "Sair da conta" }).click();
        await page.waitForURL(site + "/");
      }
    }
    async function login(role) {
      await page.goto(site + "/entrar");
      await page.getByLabel("E-mail", { exact: true }).fill(emails[role]);
      await page.getByLabel("Senha", { exact: true }).fill(senha);
      await page.getByRole("button", { name: "Entrar", exact: true }).click();
      await page.waitForURL(new RegExp("/" + role + "$"));
      await page.locator(".app-main h1").waitFor();
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    // Clear only the isolated test context, never the user's browser.
    await context.clearCookies();
    for (const role of ["igreja", "doador"]) {
      await page.goto(site + "/cadastro/" + role);
      await page
        .getByLabel(role === "igreja" ? "Nome institucional" : "Nome", {
          exact: true,
        })
        .fill(
          role === "igreja" ? "Igreja de Teste Fictícia" : "Doador de Teste",
        );
      await page.getByLabel("E-mail", { exact: true }).fill(emails[role]);
      await page.getByLabel("Senha", { exact: true }).fill(senha);
      await page.getByLabel("Confirmar senha", { exact: true }).fill(senha);
      if (role === "igreja") {
        await page
          .getByLabel("Bairro fictício", { exact: true })
          .fill("Bairro Fictício");
        await page
          .getByLabel("Endereço institucional fictício", { exact: true })
          .fill("Rua Exemplo, 123");
      }
      await page
        .getByRole("button", { name: "Criar conta", exact: true })
        .click();
      await page.waitForURL(new RegExp("/" + role + "$"));
      await page.locator(".app-main h1").waitFor();
      await page.reload();
      await page.locator(".app-main h1").waitFor();
      if (role === "igreja") {
        await page.goto(site + "/igreja/campanhas/nova");
        await page
          .getByLabel("Título da campanha")
          .fill("Campanha criada pela interface");
        await page
          .getByLabel("Descrição *", { exact: true })
          .fill("Campanha acadêmica fictícia de roupas.");
        await page.getByRole("button", { name: "Salvar campanha" }).click();
        await page.waitForURL(/\/igreja\/campanhas$/);
      } else {
        await page.goto(site + "/doador/perfil");
        await page.getByLabel("Nome fictício").fill("Nome salvo na conta");
        await page.getByRole("button", { name: "Salvar alterações" }).click();
        await page
          .getByRole("status")
          .filter({ hasText: "Perfil salvo" })
          .waitFor();
      }
      await exit();
    }
    await login("doador");
    let privateRequests = 0;
    const unavailable = (url) => url.pathname === "/api/doacoes";
    await context.route(unavailable, async (route) => {
      privateRequests++;
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ erro: "Falha privada controlada" }),
      });
    });
    await page.goto(site + "/");
    await page.getByRole("heading", { name: /Doações que/ }).waitFor();
    await page.locator(".landing-campaign-grid").waitFor();
    assert.equal(
      privateRequests,
      0,
      "Landing autenticada não deve carregar doações",
    );
    await context.unroute(unavailable);
    await page.goto(site + "/doador/perfil");
    assert.equal(
      await page.getByLabel("Nome fictício").inputValue(),
      "Nome salvo na conta",
    );
    await page.goto(site + "/campanhas");
    await page
      .getByRole("heading", { name: "Campanha criada pela interface" })
      .waitFor();
    const campaignCard = page
      .locator(".campaign-card")
      .filter({ hasText: "Campanha criada pela interface" });
    // Locate the card link by heading's nearest article, independently of CSS class.
    const link = campaignCard.getByRole("link", { name: /Conhecer campanha/ });
    if (await link.count()) await link.click();
    else
      await page
        .getByRole("heading", { name: "Campanha criada pela interface" })
        .locator("xpath=ancestor::article")
        .getByRole("link")
        .last()
        .click();
    await page
      .getByRole("link", { name: "Contribuir com esta campanha" })
      .first()
      .click();
    await page
      .getByLabel("Descrição *", { exact: true })
      .fill("Roupas para igreja cadastrada");
    await page.getByRole("button", { name: "Revisar doação" }).click();
    await page.getByRole("button", { name: "Enviar minha doação" }).click();
    await page.waitForURL(/\/doador\/doacoes\/\d+$/);
    const id = page.url().split("/").at(-1);
    await page.locator(".page-head .badge").waitFor();
    await exit();
    await login("igreja");
    await page.goto(site + "/igreja/solicitacoes/" + id);
    await page.getByRole("button", { name: "Aceitar doação" }).click();
    await page.waitForURL(/\/agendar$/);
    await page.getByLabel("Data combinada").fill(today());
    await page.getByRole("button", { name: "Salvar agendamento" }).click();
    await page
      .getByRole("button", { name: "Confirmar recebimento" })
      .click()
      .catch(async (e) => {
        console.error("NOVA CONTA:", await page.locator("body").innerText());
        throw e;
      });
    await page
      .getByRole("heading", { name: "Um gesto que chegou ao destino." })
      .waitFor();
    await exit();
    await login("doador");
    await page.goto(site + "/doador/doacoes/" + id);
    await page
      .locator(".page-head .badge")
      .filter({ hasText: "Concluída" })
      .waitFor();
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(site + "/doador/perfil");
    await page.getByLabel("Nome fictício").waitFor();
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.getByRole("button", { name: "Abrir menu", exact: true }).click();
    await page.getByRole("button", { name: "Sair da conta" }).click();
    await page.waitForURL(site + "/");
    await page.goto(site + "/doador");
    await page.waitForURL(/\/entrar$/);
    await page.getByLabel("E-mail", { exact: true }).fill(emails.doador);
    await page.getByLabel("Senha", { exact: true }).fill("senha-incorreta");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await page
      .getByRole("alert")
      .filter({ hasText: "E-mail ou senha inválidos." })
      .waitFor();
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.screenshot({
      path: "test-results/mobile-login.png",
      fullPage: true,
    });
    await page.goto(site + "/cadastro/doador");
    await page.getByLabel("Confirmar senha").waitFor();
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    assert.deepEqual(errors, []);
    await page.close();
  } catch (e) {
    console.error(
      "NOVA CONTA FALHA:",
      page.url(),
      await page.locator("body").innerText(),
    );
    throw e;
  }
  console.log(
    "Contas novas pela interface: cadastro dos dois perfis, sessão restaurada, perfil persistido, campanha, doação até conclusão e logout no celular aprovados.",
  );
}
