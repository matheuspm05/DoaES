import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { createDatabase } from "../src/database/index.js";
import { seed } from "../src/database/seed.js";
import { createApp } from "../src/app.js";
import { today } from "../src/utils/dates.js";

test("API demo: integridade, persistência e ciclo completo", async (t) => {
  const folder = mkdtempSync(join(tmpdir(), "doaes-api-"));
  const filename = join(folder, "test.sqlite");
  let db = createDatabase(filename);
  seed(db);
  let server;
  t.after(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    db.close();
    rmSync(folder, { recursive: true, force: true });
  });
  server = createApp(db).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  async function request(path, method = "GET", body) {
    const res = await fetch(base + path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, body: await res.json() };
  }
  const churches = (await request("/igrejas")).body;
  const first = churches.find((c) => c.demo_key === "esperanca"),
    noPickup = churches.find((c) => !c.oferece_coleta);
  const payload = () => ({
    igreja_id: first.id,
    doador_demo_id: 1,
    modalidade: "ENTREGA",
    itens: [
      {
        categoria_id: 1,
        descricao: "Casacos fictícios de teste",
        quantidade: 2,
        condicao: "BOM_ESTADO",
      },
    ],
  });
  await t.test(
    "health, dados mínimos, chaves estrangeiras e seed idempotente",
    async () => {
      assert.equal((await request("/health")).body.status, "online");
      assert.equal(churches.length, 3);
      assert.equal((await request("/campanhas")).body.length, 4);
      assert.equal((await request("/categorias")).body.length, 4);
      assert.equal((await request("/doadores-demo")).body.length, 2);
      assert.equal(db.prepare("PRAGMA foreign_keys").get().foreign_keys, 1);
      assert.deepEqual(
        new Set((await request("/doacoes")).body.map((d) => d.status)),
        new Set(["PENDENTE", "ACEITA", "RECUSADA", "CONCLUIDA"]),
      );
      seed(db);
      seed(db);
      assert.equal(db.prepare("SELECT count(*) n FROM doacoes").get().n, 6);
      assert.equal(db.prepare("SELECT count(*) n FROM igrejas").get().n, 3);
    },
  );
  await t.test(
    "alimentos sem validade, vencidos, condição e datas inválidas são rejeitados sem escrita parcial",
    async () => {
      const before = db.prepare("SELECT count(*) n FROM doacoes").get().n;
      for (const patch of [
        {},
        { validade: "2020-01-01" },
        { validade: "2027-02-30" },
        { validade: "2028-12-31", condicao: "BOM_ESTADO" },
      ]) {
        const body = payload();
        body.itens.push({
          categoria_id: 3,
          descricao: "Arroz lacrado",
          quantidade: 1,
          condicao: "NOVO",
          ...patch,
        });
        assert.equal((await request("/doacoes", "POST", body)).status, 400);
      }
      assert.equal(
        db.prepare("SELECT count(*) n FROM doacoes").get().n,
        before,
      );
    },
  );
  await t.test(
    "coleta não disponível, categoria não aceita, campanha encerrada e corpo inválido",
    async () => {
      const body = {
        ...payload(),
        igreja_id: noPickup.id,
        modalidade: "COLETA",
        endereco_coleta_ficticio: "Rua Fictícia",
        itens: [
          {
            categoria_id: 3,
            descricao: "Arroz",
            quantidade: 2,
            condicao: "NOVO",
            validade: "2028-12-31",
          },
        ],
      };
      assert.equal((await request("/doacoes", "POST", body)).status, 400);
      assert.equal(
        (
          await request("/doacoes", "POST", {
            ...payload(),
            igreja_id: noPickup.id,
          })
        ).status,
        400,
      );
      const closed = (await request("/campanhas")).body.find((c) => !c.ativa);
      assert.equal(
        (
          await request("/doacoes", "POST", {
            ...payload(),
            igreja_id: closed.igreja_id,
            campanha_id: closed.id,
          })
        ).status,
        400,
      );
      for (const itens of [
        [],
        [{ ...payload().itens[0], quantidade: 0 }],
        [{ ...payload().itens[0], quantidade: 1.5 }],
        [{ ...payload().itens[0], descricao: " " }],
      ])
        assert.equal(
          (await request("/doacoes", "POST", { ...payload(), itens })).status,
          400,
        );
      assert.equal(
        (
          await request("/doacoes", "POST", {
            ...payload(),
            doador_demo_id: 999,
          })
        ).status,
        404,
      );
      assert.equal(
        (await request("/doacoes", "POST", { ...payload(), itens: [null] }))
          .status,
        400,
      );
      assert.equal((await request("/doacoes", "POST", [])).status, 400);
      const malformed = await fetch(base + "/doacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{",
      });
      assert.equal(malformed.status, 400);
      assert.equal(
        (
          await request("/doacoes", "POST", {
            ...payload(),
            extra: "x".repeat(110000),
          })
        ).status,
        413,
      );
      assert.equal((await request("/doacoes/99999")).status, 404);
    },
  );
  let created;
  await t.test(
    "nova doação multitem persiste e inicia pendente; fotos nunca são persistidas",
    async () => {
      const body = payload();
      body.itens.push({
        categoria_id: 3,
        descricao: "Feijão não perecível lacrado",
        quantidade: 3,
        condicao: "NOVO",
        validade: "2028-12-31",
      });
      body.fotos = ["não persistir"];
      const result = await request("/doacoes", "POST", body);
      assert.equal(result.status, 201);
      created = result.body.id;
      assert.equal(result.body.status, "PENDENTE");
      assert.equal(result.body.itens.length, 2);
      assert.equal(
        db
          .prepare("SELECT count(*) n FROM itens_doacao WHERE doacao_id=?")
          .get(created).n,
        2,
      );
      assert.ok(!("fotos" in result.body));
      assert.ok(
        !db
          .prepare(
            "SELECT name FROM sqlite_master WHERE name LIKE '%foto%' OR name LIKE '%image%'",
          )
          .get(),
      );
      assert.equal(
        (
          await request(`/doacoes/${created}/agendamento`, "PATCH", {
            data: today(),
            periodo: "MANHA",
          })
        ).status,
        409,
      );
      assert.equal(
        (await request(`/doacoes/${created}/concluir`, "PATCH", {})).status,
        409,
      );
    },
  );
  await t.test(
    "aceitar → agendar → concluir atualiza histórico e rejeita transições inválidas",
    async () => {
      assert.equal(
        (
          await request(`/doacoes/${created}/decisao`, "PATCH", {
            status: "ACEITA",
          })
        ).body.status,
        "ACEITA",
      );
      assert.equal(
        (
          await request(`/doacoes/${created}/decisao`, "PATCH", {
            status: "RECUSADA",
          })
        ).status,
        409,
      );
      assert.equal(
        (await request(`/doacoes/${created}/concluir`, "PATCH", {})).status,
        409,
      );
      assert.equal(
        (
          await request(`/doacoes/${created}/agendamento`, "PATCH", {
            data: "2020-01-01",
            periodo: "MANHA",
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await request(`/doacoes/${created}/agendamento`, "PATCH", {
            data: today(),
            periodo: "INVALIDO",
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await request(`/doacoes/${created}/agendamento`, "PATCH", {
            data: today(),
            periodo: "MANHA",
            observacoes: "Teste fictício",
          })
        ).status,
        200,
      );
      assert.equal(
        (
          await request(`/doacoes/${created}/agendamento`, "PATCH", {
            data: today(),
            periodo: "TARDE",
          })
        ).body.agendamento.periodo,
        "TARDE",
      );
      assert.equal(
        db
          .prepare("SELECT count(*) n FROM agendamentos WHERE doacao_id=?")
          .get(created).n,
        1,
      );
      const result = await request(`/doacoes/${created}/concluir`, "PATCH", {});
      assert.equal(result.body.status, "CONCLUIDA");
      assert.equal(result.body.eventos.at(-1).tipo, "CONCLUIDA");
      assert.equal(
        (await request(`/doacoes/${created}/concluir`, "PATCH", {})).status,
        409,
      );
      assert.equal(
        (
          await request(`/doacoes/${created}/agendamento`, "PATCH", {
            data: today(),
            periodo: "MANHA",
          })
        ).status,
        409,
      );
      assert.equal(
        (await request("/doacoes?doador_demo_id=1")).body.find(
          (d) => d.id === created,
        ).status,
        "CONCLUIDA",
      );
    },
  );
  await t.test(
    "recusa permanece no histórico e não pode agendar nem concluir",
    async () => {
      const d = (await request("/doacoes", "POST", payload())).body;
      assert.equal(
        (
          await request(`/doacoes/${d.id}/decisao`, "PATCH", {
            status: "RECUSADA",
            motivo_recusa: "Itens já atendidos.",
          })
        ).body.motivo_recusa,
        "Itens já atendidos.",
      );
      assert.equal(
        (
          await request(`/doacoes/${d.id}/agendamento`, "PATCH", {
            data: today(),
            periodo: "MANHA",
          })
        ).status,
        409,
      );
      assert.equal(
        (await request(`/doacoes/${d.id}/concluir`, "PATCH", {})).status,
        409,
      );
      assert.ok(
        (
          await request(`/doacoes?igreja_id=${first.id}&status=RECUSADA`)
        ).body.some((row) => row.id === d.id),
      );
    },
  );
  await t.test(
    "configurações e campanhas criadas/editadas/encerradas refletem nos GETs públicos",
    async () => {
      assert.equal(
        (
          await request(`/igrejas/${first.id}`, "PATCH", {
            descricao: "Nova descrição inteiramente fictícia.",
          })
        ).body.descricao,
        "Nova descrição inteiramente fictícia.",
      );
      assert.equal(
        (await request(`/igrejas/${first.id}`, "PATCH", { categorias: [] }))
          .status,
        400,
      );
      const result = await request("/campanhas", "POST", {
        igreja_id: first.id,
        titulo: "Campanha fictícia de teste",
        descricao: "Exemplo",
        categoria_id: 1,
        ativa: true,
      });
      assert.equal(result.status, 201);
      const campaign = result.body;
      assert.equal(
        (
          await request(`/campanhas/${campaign.id}`, "PATCH", {
            titulo: "Título editado",
            ativa: false,
          })
        ).body.ativa,
        false,
      );
      assert.equal(
        (await request(`/campanhas/${campaign.id}`)).body.titulo,
        "Título editado",
      );
      assert.equal(
        (
          await request("/doacoes", "POST", {
            ...payload(),
            campanha_id: campaign.id,
          })
        ).status,
        400,
      );
      const count = db.prepare("SELECT count(*) n FROM campanhas").get().n;
      seed(db);
      assert.equal(
        db.prepare("SELECT count(*) n FROM campanhas").get().n,
        count,
      );
      assert.equal(
        (await request(`/campanhas/${campaign.id}`)).body.ativa,
        false,
      );
    },
  );
  await t.test(
    "registros sobrevivem ao fechamento e reabertura do arquivo SQLite",
    async () => {
      await new Promise((resolve) => server.close(resolve));
      server = null;
      db.close();
      db = createDatabase(filename);
      seed(db);
      assert.equal(
        db.prepare("SELECT status FROM doacoes WHERE id=?").get(created).status,
        "CONCLUIDA",
      );
      assert.equal(
        db
          .prepare("SELECT count(*) n FROM itens_doacao WHERE doacao_id=?")
          .get(created).n,
        2,
      );
      assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
    },
  );
});

test("migração preserva registros da tabela igrejas original", () => {
  const folder = mkdtempSync(join(tmpdir(), "doaes-migration-")),
    filename = join(folder, "legacy.sqlite");
  const legacy = new DatabaseSync(filename);
  legacy.exec(
    "CREATE TABLE igrejas (id INTEGER PRIMARY KEY AUTOINCREMENT,nome TEXT NOT NULL)",
  );
  legacy
    .prepare("INSERT INTO igrejas (nome) VALUES (?)")
    .run("Registro existente a preservar");
  legacy.close();
  const db = createDatabase(filename);
  seed(db);
  seed(db);
  assert.equal(
    db.prepare("SELECT nome FROM igrejas WHERE id=1").get().nome,
    "Registro existente a preservar",
  );
  assert.equal(db.prepare("SELECT count(*) n FROM igrejas").get().n, 4);
  db.close();
  rmSync(folder, { recursive: true, force: true });
});
