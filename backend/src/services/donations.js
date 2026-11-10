export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export function requireValue(condition, message, status = 400) {
  if (!condition) throw new ApiError(status, message);
}
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
export function today() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function date(value, label) {
  requireValue(
    typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(Date.parse(value)) &&
      new Date(value).toISOString().slice(0, 10) === value,
    `${label}: informe uma data válida.`,
  );
  return value;
}
export function find(db, table, value) {
  const record = db.prepare(`SELECT * FROM ${table} WHERE id=?`).get(id(value));
  requireValue(record, "Registro não encontrado.", 404);
  return record;
}
export function churchDetail(db, church) {
  return {
    ...church,
    oferece_coleta: Boolean(church.oferece_coleta),
    categorias: db
      .prepare(
        "SELECT c.* FROM categorias c JOIN igreja_categorias ic ON ic.categoria_id=c.id WHERE ic.igreja_id=?",
      )
      .all(church.id),
  };
}
export function donationDetail(db, donation) {
  return {
    ...donation,
    igreja: churchDetail(db, find(db, "igrejas", donation.igreja_id)),
    doador: find(db, "doadores_demo", donation.doador_demo_id),
    campanha: donation.campanha_id
      ? find(db, "campanhas", donation.campanha_id)
      : null,
    itens: db
      .prepare(
        "SELECT i.*,c.nome categoria,c.slug categoria_slug FROM itens_doacao i JOIN categorias c ON i.categoria_id=c.id WHERE doacao_id=?",
      )
      .all(donation.id),
    agendamento:
      db
        .prepare("SELECT * FROM agendamentos WHERE doacao_id=?")
        .get(donation.id) ?? null,
    eventos: db
      .prepare("SELECT * FROM eventos_doacao WHERE doacao_id=? ORDER BY id")
      .all(donation.id),
  };
}
export function event(db, donation, tipo, descricao) {
  db.prepare(
    "INSERT INTO eventos_doacao (doacao_id,tipo,descricao) VALUES (?,?,?)",
  ).run(donation, tipo, descricao);
  db.prepare(
    "UPDATE doacoes SET updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?",
  ).run(donation);
}
export function validateDonation(db, body) {
  const igreja = find(db, "igrejas", body.igreja_id);
  const donor = find(db, "doadores_demo", body.doador_demo_id);
  requireValue(
    ["COLETA", "ENTREGA"].includes(body.modalidade),
    "Escolha coleta ou entrega presencial.",
  );
  requireValue(
    body.modalidade !== "COLETA" || igreja.oferece_coleta,
    "Esta igreja não oferece coleta.",
  );
  const address =
    body.modalidade === "COLETA"
      ? text(body.endereco_coleta_ficticio, "Endereço fictício", true, 300)
      : null;
  let campaign = null;
  if (body.campanha_id) {
    campaign = find(db, "campanhas", body.campanha_id);
    requireValue(
      campaign.igreja_id === igreja.id && campaign.ativa,
      "A campanha precisa estar ativa e pertencer à igreja escolhida.",
    );
  }
  requireValue(
    Array.isArray(body.itens) &&
      body.itens.length > 0 &&
      body.itens.length <= 30,
    "Adicione de 1 a 30 itens.",
  );
  const items = body.itens.map((item) => {
    requireValue(
      item && typeof item === "object" && !Array.isArray(item),
      "Item da doação inválido.",
    );
    const category = find(db, "categorias", item.categoria_id);
    requireValue(
      db
        .prepare(
          "SELECT 1 FROM igreja_categorias WHERE igreja_id=? AND categoria_id=?",
        )
        .get(igreja.id, category.id),
      "A igreja não aceita a categoria deste item.",
    );
    const description = text(item.descricao, "Descrição do item", true, 500);
    requireValue(
      Number.isInteger(item.quantidade) &&
        item.quantidade > 0 &&
        item.quantidade <= 10000,
      "Quantidade deve ser um número inteiro entre 1 e 10000.",
    );
    requireValue(
      ["NOVO", "BOM_ESTADO"].includes(item.condicao),
      "Condição inválida.",
    );
    let expiry = null;
    if (category.slug === "alimentos") {
      expiry = date(item.validade, "Validade do alimento");
      requireValue(
        expiry >= today(),
        "O alimento precisa estar dentro da validade.",
      );
      requireValue(
        item.condicao === "NOVO",
        "Alimentos devem estar novos e lacrados.",
      );
    }
    return {
      categoria_id: category.id,
      descricao: description,
      quantidade: item.quantidade,
      condicao: item.condicao,
      validade: expiry,
    };
  });
  return { igreja, donor, address, campaign, items };
}
