import { Router } from "express";
import { transaction } from "../database/index.js";
import {
  requireValue,
  text,
  id,
  date,
  today,
  find,
  churchDetail,
  donationDetail,
  validateDonation,
  event,
} from "../services/donations.js";

export function apiRoutes(db) {
  const router = Router();
  router.use((req, _res, next) => {
    if (["POST", "PATCH"].includes(req.method))
      requireValue(
        req.body && typeof req.body === "object" && !Array.isArray(req.body),
        "Envie um objeto JSON válido.",
      );
    next();
  });
  router.get("/health", (_req, res) =>
    res.json({
      status: "online",
      projeto: "DoaES",
      banco: "SQLite",
      modo: "demonstracao",
    }),
  );
  router.get("/categorias", (_req, res) =>
    res.json(db.prepare("SELECT * FROM categorias").all()),
  );
  router.get("/doadores-demo", (_req, res) =>
    res.json(db.prepare("SELECT * FROM doadores_demo").all()),
  );
  router.get("/igrejas", (_req, res) =>
    res.json(
      db
        .prepare("SELECT * FROM igrejas ORDER BY id")
        .all()
        .map((c) => churchDetail(db, c)),
    ),
  );
  router.get("/igrejas/:id", (req, res) =>
    res.json(churchDetail(db, find(db, "igrejas", req.params.id))),
  );
  router.patch("/igrejas/:id", (req, res) => {
    const existing = find(db, "igrejas", req.params.id),
      body = {
        ...existing,
        oferece_coleta: Boolean(existing.oferece_coleta),
        ...req.body,
      };
    const values = [
      "nome",
      "descricao",
      "cidade",
      "bairro",
      "endereco_publico_ficticio",
    ].map((k) => text(body[k], k, true, k === "descricao" ? 2000 : 300));
    requireValue(
      ["Vila Velha", "Vitória"].includes(body.cidade),
      "Escolha Vila Velha ou Vitória.",
    );
    requireValue(
      typeof body.oferece_coleta === "boolean",
      "Informe se oferece coleta.",
    );
    const area = text(body.area_coleta, "Área de coleta", false, 500),
      conditions = text(
        body.condicoes_coleta,
        "Condições de coleta",
        false,
        1000,
      );
    const categories =
      req.body.categorias ??
      churchDetail(db, existing).categorias.map((c) => c.id);
    requireValue(
      Array.isArray(categories) &&
        categories.length > 0 &&
        categories.length <= 4,
      "Selecione ao menos uma categoria.",
    );
    const unique = [...new Set(categories.map((c) => id(c, "Categoria")))];
    unique.forEach((c) => find(db, "categorias", c));
    transaction(db, () => {
      db.prepare(
        "UPDATE igrejas SET nome=?,descricao=?,cidade=?,bairro=?,endereco_publico_ficticio=?,oferece_coleta=?,area_coleta=?,condicoes_coleta=? WHERE id=?",
      ).run(
        ...values,
        Number(body.oferece_coleta),
        area,
        conditions,
        existing.id,
      );
      db.prepare("DELETE FROM igreja_categorias WHERE igreja_id=?").run(
        existing.id,
      );
      unique.forEach((c) =>
        db
          .prepare("INSERT INTO igreja_categorias VALUES (?,?)")
          .run(existing.id, c),
      );
    });
    res.json(churchDetail(db, find(db, "igrejas", existing.id)));
  });
  const campaigns = () =>
    db
      .prepare("SELECT * FROM campanhas ORDER BY id DESC")
      .all()
      .map((c) => ({
        ...c,
        ativa: Boolean(c.ativa),
        igreja: churchDetail(db, find(db, "igrejas", c.igreja_id)),
        categoria: c.categoria_id
          ? find(db, "categorias", c.categoria_id)
          : null,
      }));
  router.get("/campanhas", (req, res) =>
    res.json(
      campaigns().filter(
        (c) =>
          (!req.query.igreja_id || c.igreja_id === id(req.query.igreja_id)) &&
          (!req.query.ativa || c.ativa === (req.query.ativa === "true")),
      ),
    ),
  );
  router.get("/campanhas/:id", (req, res) => {
    find(db, "campanhas", req.params.id);
    res.json(campaigns().find((c) => c.id === id(req.params.id)));
  });
  function campaignValues(body) {
    const church = find(db, "igrejas", body.igreja_id),
      category = body.categoria_id ? id(body.categoria_id) : null;
    if (category) {
      find(db, "categorias", category);
      requireValue(
        db
          .prepare(
            "SELECT 1 FROM igreja_categorias WHERE igreja_id=? AND categoria_id=?",
          )
          .get(church.id, category),
        "Escolha uma categoria aceita pela igreja.",
      );
    }
    requireValue(
      typeof body.ativa === "boolean",
      "Informe se a campanha está ativa.",
    );
    return [
      church.id,
      text(body.titulo, "Título", true, 120),
      text(body.descricao, "Descrição", true, 2000),
      category,
      Number(body.ativa),
    ];
  }
  router.post("/campanhas", (req, res) => {
    const result = db
      .prepare(
        "INSERT INTO campanhas (igreja_id,titulo,descricao,categoria_id,ativa) VALUES (?,?,?,?,?)",
      )
      .run(...campaignValues(req.body));
    res
      .status(201)
      .json(campaigns().find((c) => c.id === Number(result.lastInsertRowid)));
  });
  router.patch("/campanhas/:id", (req, res) => {
    const existing = find(db, "campanhas", req.params.id);
    requireValue(
      !req.body.igreja_id || Number(req.body.igreja_id) === existing.igreja_id,
      "Não é possível transferir uma campanha.",
    );
    db.prepare(
      "UPDATE campanhas SET igreja_id=?,titulo=?,descricao=?,categoria_id=?,ativa=?,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?",
    ).run(
      ...campaignValues({
        ...existing,
        ativa: Boolean(existing.ativa),
        ...req.body,
      }),
      existing.id,
    );
    res.json(campaigns().find((c) => c.id === existing.id));
  });
  router.get("/doacoes", (req, res) => {
    const filters = [],
      values = [];
    for (const k of ["doador_demo_id", "igreja_id"])
      if (req.query[k]) {
        filters.push(`${k}=?`);
        values.push(id(req.query[k]));
      }
    if (req.query.status) {
      requireValue(
        ["PENDENTE", "ACEITA", "RECUSADA", "CONCLUIDA"].includes(
          req.query.status,
        ),
        "Status inválido.",
      );
      filters.push("status=?");
      values.push(req.query.status);
    }
    res.json(
      db
        .prepare(
          `SELECT * FROM doacoes ${filters.length ? "WHERE " + filters.join(" AND ") : ""} ORDER BY id DESC`,
        )
        .all(...values)
        .map((d) => donationDetail(db, d)),
    );
  });
  router.get("/doacoes/:id", (req, res) =>
    res.json(donationDetail(db, find(db, "doacoes", req.params.id))),
  );
  router.post("/doacoes", (req, res) => {
    const { igreja, donor, address, campaign, items } = validateDonation(
      db,
      req.body,
    );
    const donationId = transaction(db, () => {
      const result = db
        .prepare(
          "INSERT INTO doacoes (doador_demo_id,igreja_id,campanha_id,modalidade,endereco_coleta_ficticio) VALUES (?,?,?,?,?)",
        )
        .run(
          donor.id,
          igreja.id,
          campaign?.id ?? null,
          req.body.modalidade,
          address,
        );
      const donationId = Number(result.lastInsertRowid);
      items.forEach((i) =>
        db
          .prepare(
            "INSERT INTO itens_doacao (doacao_id,categoria_id,descricao,quantidade,condicao,validade) VALUES (?,?,?,?,?,?)",
          )
          .run(
            donationId,
            i.categoria_id,
            i.descricao,
            i.quantidade,
            i.condicao,
            i.validade,
          ),
      );
      event(
        db,
        donationId,
        "PENDENTE",
        "Doação enviada para análise da igreja.",
      );
      return donationId;
    });
    res.status(201).json(donationDetail(db, find(db, "doacoes", donationId)));
  });
  router.patch("/doacoes/:id/decisao", (req, res) => {
    const donation = find(db, "doacoes", req.params.id);
    requireValue(
      donation.status === "PENDENTE",
      "Somente doações pendentes podem ser analisadas.",
      409,
    );
    requireValue(
      ["ACEITA", "RECUSADA"].includes(req.body.status),
      "Escolha ACEITA ou RECUSADA.",
    );
    const reason =
      req.body.status === "RECUSADA"
        ? text(req.body.motivo_recusa, "Motivo da recusa", false, 500)
        : null;
    transaction(db, () => {
      db.prepare("UPDATE doacoes SET status=?,motivo_recusa=? WHERE id=?").run(
        req.body.status,
        reason,
        donation.id,
      );
      event(
        db,
        donation.id,
        req.body.status,
        req.body.status === "ACEITA"
          ? "Solicitação aceita pela igreja."
          : "Solicitação recusada pela igreja.",
      );
    });
    res.json(donationDetail(db, find(db, "doacoes", donation.id)));
  });
  router.patch("/doacoes/:id/agendamento", (req, res) => {
    const donation = find(db, "doacoes", req.params.id);
    requireValue(
      donation.status === "ACEITA",
      "O agendamento exige uma doação aceita.",
      409,
    );
    const day = date(req.body.data, "Data do agendamento");
    requireValue(day >= today(), "Escolha uma data a partir de hoje.");
    requireValue(
      ["MANHA", "TARDE", "NOITE"].includes(req.body.periodo),
      "Período inválido.",
    );
    const notes = text(req.body.observacoes, "Observações", false, 1000);
    transaction(db, () => {
      db.prepare(
        "INSERT INTO agendamentos (doacao_id,data,periodo,observacoes) VALUES (?,?,?,?) ON CONFLICT(doacao_id) DO UPDATE SET data=excluded.data,periodo=excluded.periodo,observacoes=excluded.observacoes,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')",
      ).run(donation.id, day, req.body.periodo, notes);
      event(
        db,
        donation.id,
        "AGENDADA",
        `Agendamento combinado: ${day}, ${req.body.periodo.toLowerCase()}.`,
      );
    });
    res.json(donationDetail(db, find(db, "doacoes", donation.id)));
  });
  router.patch("/doacoes/:id/concluir", (req, res) => {
    const donation = find(db, "doacoes", req.params.id);
    requireValue(
      donation.status === "ACEITA",
      "Somente doações aceitas podem ser concluídas.",
      409,
    );
    requireValue(
      db
        .prepare("SELECT 1 FROM agendamentos WHERE doacao_id=?")
        .get(donation.id),
      "Agende a doação antes de confirmar o recebimento.",
      409,
    );
    transaction(db, () => {
      db.prepare("UPDATE doacoes SET status='CONCLUIDA' WHERE id=?").run(
        donation.id,
      );
      event(
        db,
        donation.id,
        "CONCLUIDA",
        "Recebimento confirmado. Obrigado por fazer a diferença!",
      );
    });
    res.json(donationDetail(db, find(db, "doacoes", donation.id)));
  });
  router.use((_req, res) =>
    res.status(404).json({ erro: "Rota da API não encontrada." }),
  );
  return router;
}
