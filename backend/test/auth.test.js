import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { createDatabase } from "../src/database/index.js";
import { seed } from "../src/database/seed.js";
import { createApp } from "../src/app.js";
import { client } from "../../test/support/auth.js";
import { today } from "../src/utils/dates.js";

test("Contas, sessões persistentes e autorização entre identidades distintas", async (t) => {
  const db = createDatabase(":memory:");
  seed(db);
  const server = createApp(db).listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  t.after(async () => {
    await new Promise((r) => server.close(r));
    db.close();
  });
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const anon = client(base),
    donor = client(base),
    other = client(base),
    church = client(base),
    churchB = client(base);
  const senha = randomBytes(18).toString("hex");
  const body = (tipo, email) => ({
    tipo,
    email,
    senha,
    confirmacao_senha: senha,
    nome: "Conta fictícia",
    cidade: "Vila Velha",
    bairro: "Bairro exemplo",
    endereco_publico_ficticio: "Rua institucional fictícia",
    categorias: [1, 3],
  });
  let d, c, b, donation;
  await t.test(
    "anônimo consulta catálogo, não consulta doações nem escreve sem CSRF",
    async () => {
      assert.equal((await anon("/igrejas")).status, 200);
      assert.equal((await anon("/doacoes")).status, 401);
      assert.equal(
        (
          await anon(
            "/auth/register",
            "POST",
            body("DOADOR", "a@exemplo.invalid"),
          )
        ).status,
        403,
      );
      const me = await anon("/auth/me");
      assert.equal(me.body.user, null);
      assert.match(me.headers.get("set-cookie"), /HttpOnly; SameSite=Lax/);
    },
  );
  await t.test(
    "cadastros vinculam contas novas sem aproveitar identidade do seed",
    async () => {
      for (const [call, tipo, email] of [
        [donor, "DOADOR", "a@exemplo.invalid"],
        [other, "DOADOR", "b@exemplo.invalid"],
        [church, "IGREJA", "c@exemplo.invalid"],
        [churchB, "IGREJA", "d@exemplo.invalid"],
      ]) {
        await call("/auth/me");
        const r = await call("/auth/register", "POST", body(tipo, email));
        assert.equal(r.status, 201, JSON.stringify(r.body));
        assert.ok(!JSON.stringify(r.body).includes("senha_hash"));
      }
      d = (await donor("/auth/me")).body.user;
      c = (await church("/auth/me")).body.user;
      b = (await churchB("/auth/me")).body.user;
      assert.ok(d.doador_id > 2);
      assert.ok(c.igreja_id > 3);
      const row = db
        .prepare("SELECT senha_hash FROM usuarios WHERE id=?")
        .get(d.id);
      assert.match(row.senha_hash, /^scrypt:/);
      assert.ok(!row.senha_hash.includes(senha));
      seed(db);
      assert.equal(db.prepare("SELECT count(*) n FROM usuarios").get().n, 4);
    },
  );
  await t.test(
    "e-mail único, perfil inválido e confirmação de senha são validados",
    async () => {
      assert.equal(
        (
          await anon(
            "/auth/register",
            "POST",
            body("DOADOR", "A@exemplo.invalid"),
          )
        ).status,
        409,
      );
      assert.equal(
        (
          await anon(
            "/auth/register",
            "POST",
            body("ADMIN", "admin@exemplo.invalid"),
          )
        ).status,
        400,
      );
      assert.equal(
        (
          await anon("/auth/register", "POST", {
            ...body("DOADOR", "e@exemplo.invalid"),
            confirmacao_senha: "errada",
          })
        ).status,
        400,
      );
    },
  );
  await t.test(
    "login genérico, rotação da sessão, CSRF anterior rejeitado e limite de tentativas",
    async () => {
      const call = client(base);
      const before = await call("/auth/me");
      assert.equal(
        (
          await call("/auth/login", "POST", {
            email: "a@exemplo.invalid",
            senha: "incorreta",
          })
        ).status,
        401,
      );
      const login = await call("/auth/login", "POST", {
        email: "a@exemplo.invalid",
        senha,
      });
      assert.equal(login.status, 200);
      assert.notEqual(
        login.headers.get("set-cookie"),
        before.headers.get("set-cookie"),
      );
      assert.equal(
        (
          await call("/auth/profile", "PATCH", d.perfil, {
            "X-CSRF-Token": before.body.csrfToken,
          })
        ).status,
        403,
      );
      const old = before.headers.get("set-cookie").split(";")[0];
      assert.equal(
        (await client(base, { Cookie: old })("/auth/me")).body.user,
        null,
      );
      for (let i = 0; i < 10; i++)
        assert.equal(
          (
            await call("/auth/login", "POST", {
              email: "limite@exemplo.invalid",
              senha,
            })
          ).status,
          401,
        );
      assert.equal(
        (
          await call("/auth/login", "POST", {
            email: "limite@exemplo.invalid",
            senha,
          })
        ).status,
        429,
      );
    },
  );
  await t.test(
    "perfil do doador persiste e corpo com ID de outro usuário não troca identidade",
    async () => {
      const profile = { ...d.perfil, nome: "Nome atualizado", id: 999 };
      assert.equal(
        (await donor("/auth/profile", "PATCH", profile)).status,
        200,
      );
      assert.equal(
        (await donor("/auth/me")).body.user.perfil.nome,
        "Nome atualizado",
      );
      assert.notEqual(
        (await other("/auth/me")).body.user.perfil.nome,
        "Nome atualizado",
      );
    },
  );
  await t.test(
    "igrejas e campanhas exigem titularidade também com IDs alterados",
    async () => {
      assert.equal(
        (await church(`/igrejas/${b.igreja_id}`, "PATCH", { nome: "Intruso" }))
          .status,
        403,
      );
      assert.equal(
        (await donor(`/igrejas/${c.igreja_id}`, "PATCH", { nome: "Intruso" }))
          .status,
        403,
      );
      assert.equal(
        (
          await church(`/igrejas/${c.igreja_id}`, "PATCH", {
            oferece_coleta: true,
            condicoes_coleta: "Com agendamento",
          })
        ).status,
        200,
      );
      const campaign = await church("/campanhas", "POST", {
        titulo: "Campanha nova",
        descricao: "Fictícia",
        categoria_id: 1,
        ativa: true,
      });
      assert.equal(campaign.status, 201);
      assert.equal(
        (
          await churchB(`/campanhas/${campaign.body.id}`, "PATCH", {
            ativa: false,
          })
        ).status,
        403,
      );
      assert.equal(
        (
          await church("/campanhas", "POST", {
            igreja_id: b.igreja_id,
            titulo: "Intruso",
          })
        ).status,
        403,
      );
    },
  );
  await t.test(
    "doação pertence à sessão, listagens não contêm endereço e outro usuário não lê detalhe",
    async () => {
      const payload = {
        igreja_id: c.igreja_id,
        modalidade: "COLETA",
        endereco_coleta_ficticio: "Endereço PRIVADO fictício",
        itens: [
          {
            categoria_id: 1,
            descricao: "Camisetas",
            quantidade: 2,
            condicao: "BOM_ESTADO",
          },
          {
            categoria_id: 3,
            descricao: "Arroz",
            quantidade: 1,
            condicao: "NOVO",
            validade: "2028-12-31",
          },
        ],
      };
      assert.equal(
        (await donor("/doacoes", "POST", { ...payload, doador_demo_id: 1 }))
          .status,
        403,
      );
      donation = await donor("/doacoes", "POST", payload);
      assert.equal(donation.status, 201);
      donation = donation.body;
      assert.equal(donation.doador_demo_id, d.doador_id);
      for (const call of [donor, church]) {
        const list = await call("/doacoes?doador_demo_id=1&igreja_id=1");
        assert.equal(list.body.length, 1);
        assert.ok(
          !JSON.stringify(list.body).includes("endereco_coleta_ficticio"),
        );
        assert.equal(
          (await call(`/doacoes/${donation.id}`)).body.endereco_coleta_ficticio,
          payload.endereco_coleta_ficticio,
        );
      }
      for (const call of [other, churchB]) {
        assert.equal((await call(`/doacoes/${donation.id}`)).status, 403);
        assert.equal((await call("/doacoes")).body.length, 0);
      }
    },
  );
  await t.test(
    "somente igreja destinatária pode aceitar, agendar e concluir",
    async () => {
      const id = donation.id;
      for (const call of [donor, other, churchB])
        for (const action of ["decisao", "agendamento", "concluir"])
          assert.equal(
            (
              await call(`/doacoes/${id}/${action}`, "PATCH", {
                status: "ACEITA",
                data: today(),
                periodo: "MANHA",
              })
            ).status,
            403,
          );
      assert.equal(
        (await church(`/doacoes/${id}/decisao`, "PATCH", { status: "ACEITA" }))
          .status,
        200,
      );
      assert.equal(
        (
          await church(`/doacoes/${id}/agendamento`, "PATCH", {
            data: today(),
            periodo: "MANHA",
          })
        ).status,
        200,
      );
      assert.equal(
        (await church(`/doacoes/${id}/concluir`, "PATCH", {})).status,
        200,
      );
      assert.equal((await donor(`/doacoes/${id}`)).body.status, "CONCLUIDA");
    },
  );
  await t.test(
    "logout invalida cookie antigo; sessão expirada ou adulterada não autentica",
    async () => {
      const login = await donor.login("a@exemplo.invalid", senha),
        cookie = login.headers.get("set-cookie").split(";")[0];
      assert.equal((await donor("/auth/logout", "POST", {})).status, 200);
      assert.equal(
        (await client(base, { Cookie: cookie })("/auth/me")).body.user,
        null,
      );
      assert.equal(
        (await client(base, { Cookie: cookie + "x" })("/auth/me")).body.user,
        null,
      );
      const again = await donor.login("a@exemplo.invalid", senha);
      db.prepare("UPDATE sessoes SET expira=0 WHERE usuario_id=?").run(d.id);
      assert.equal(
        (
          await client(base, {
            Cookie: again.headers.get("set-cookie").split(";")[0],
          })("/auth/me")
        ).body.user,
        null,
      );
    },
  );
});

// Exercise the optional local credentials without touching the presentation DB.
test("Seed local de contas é idempotente e proibido em produção", async () => {
  const { mkdtempSync, rmSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join, resolve } = await import("node:path");
  const { spawnSync } = await import("node:child_process");
  const folder = mkdtempSync(join(tmpdir(), "doaes-accounts-")),
    file = join(folder, "test.sqlite");
  const run = (production = false) =>
    spawnSync(process.execPath, [resolve("src/database/seedAccounts.js")], {
      env: {
        ...process.env,
        NODE_ENV: production ? "production" : "development",
        SQLITE_PATH: file,
        LOCAL_SEED_PASSWORD: randomBytes(18).toString("hex"),
      },
      encoding: "utf8",
      windowsHide: true,
    });
  try {
    assert.equal(run().status, 0);
    const db = createDatabase(file);
    try {
      const before = db
        .prepare("SELECT id,email,senha_hash FROM usuarios ORDER BY id")
        .all();
      assert.equal(before.length, 5);
      assert.equal(run().status, 0);
      assert.deepEqual(
        db
          .prepare("SELECT id,email,senha_hash FROM usuarios ORDER BY id")
          .all(),
        before,
      );
      assert.notEqual(run(true).status, 0);
    } finally {
      db.close();
    }
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});
