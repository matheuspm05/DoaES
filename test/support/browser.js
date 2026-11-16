export async function browserLogin(page, role, password) {
  const site = new URL(page.url()).origin;
  await page.goto(site + "/entrar");
  await page
    .locator(".app-main h1")
    .or(page.getByLabel("E-mail", { exact: true }))
    .first()
    .waitFor();
  const logout = page.getByRole("button", { name: "Sair da conta" });
  if (await logout.count()) {
    // Desktop sidebar may be hidden on mobile; logout remains the same real HTTP action.
    await logout.click({ force: true }).catch(async () => {
      await page
        .getByRole("button", { name: "Abrir menu", exact: true })
        .click();
      await logout.click();
    });
    await page.waitForURL(site + "/");
    await page.goto(site + "/entrar");
  }
  await page
    .getByLabel("E-mail", { exact: true })
    .fill(role + "1@fixture.invalid");
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.waitForURL(new RegExp("/" + role + "$"));
  await page
    .locator(".app-main h1")
    .waitFor()
    .catch(async (e) => {
      console.error(await page.locator("body").innerText());
      throw e;
    });
}
