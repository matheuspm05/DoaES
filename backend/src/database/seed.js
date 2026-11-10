import { createDatabase, transaction } from "./index.js";
import { pathToFileURL } from "node:url";

export function seed(db) {
  return transaction(db, () => {
    const categories = [
      ["Roupas", "roupas"],
      ["Brinquedos", "brinquedos"],
      ["Alimentos não perecíveis", "alimentos"],
      ["Higiene e limpeza", "higiene"],
    ];
    categories.forEach(([nome, slug], i) =>
      db
        .prepare(
          "INSERT OR IGNORE INTO categorias (id,nome,slug) VALUES (?,?,?)",
        )
        .run(i + 1, nome, slug),
    );
    db.prepare("INSERT OR IGNORE INTO doadores_demo VALUES (?,?,?,?)").run(
      1,
      "Ana Demo",
      "Vila Velha",
      "ana@exemplo.invalid",
    );
    db.prepare("INSERT OR IGNORE INTO doadores_demo VALUES (?,?,?,?)").run(
      2,
      "Lucas Demo",
      "Vitória",
      "lucas@exemplo.invalid",
    );
    const churches = [
      [
        "esperanca",
        "Igreja Semente de Esperança",
        "Uma igreja fictícia que aproxima gestos de cuidado e famílias da região. Nossas campanhas demonstram como roupas, brinquedos e itens de higiene podem ganhar um novo destino.",
        "Vila Velha",
        "Bairro Exemplo",
        "Rua Fictícia das Sementes, 100 — endereço demonstrativo",
        1,
        "Bairros de exemplo em Vila Velha",
        "Coleta pela igreja, de segunda a sexta, mediante agendamento.",
        [1, 2, 3, 4],
      ],
      [
        "vida",
        "Comunidade Horizonte de Vida",
        "Instituição inteiramente fictícia dedicada, nesta demonstração, à arrecadação de alimentos não perecíveis e brinquedos.",
        "Vitória",
        "Jardim Ilustrativo",
        "Avenida Imaginária, 200 — endereço demonstrativo",
        0,
        "",
        "Somente entrega presencial agendada. Não realizamos coleta.",
        [2, 3, 4],
      ],
      [
        "caminhos",
        "Igreja Novos Caminhos do Bem",
        "Exemplo fictício de comunidade que organiza campanhas de roupas e alimentos para representar o funcionamento do DoaES.",
        "Vila Velha",
        "Vila Demonstrativa",
        "Praça de Exemplo, 30 — endereço demonstrativo",
        1,
        "Vila Demonstrativa e arredores fictícios",
        "Coleta às terças e quintas, após combinar o período.",
        [1, 3],
      ],
    ];
    const churchIds = churches.map(
      ([
        key,
        nome,
        desc,
        cidade,
        bairro,
        endereco,
        coleta,
        area,
        condicoes,
        cats,
      ]) => {
        const existing = db
          .prepare("SELECT id FROM igrejas WHERE demo_key=?")
          .get(key);
        if (existing) return existing.id;
        const result = db
          .prepare(
            `INSERT INTO igrejas (demo_key,nome,descricao,cidade,bairro,endereco_publico_ficticio,oferece_coleta,area_coleta,condicoes_coleta) VALUES (?,?,?,?,?,?,?,?,?)`,
          )
          .run(
            key,
            nome,
            desc,
            cidade,
            bairro,
            endereco,
            coleta,
            area,
            condicoes,
          );
        const id = Number(result.lastInsertRowid);
        cats.forEach((cat) =>
          db.prepare("INSERT INTO igreja_categorias VALUES (?,?)").run(id, cat),
        );
        return id;
      },
    );
    const campaigns = [
      [
        "agasalho",
        churchIds[0],
        "Um abraço em forma de roupa",
        "Roupas limpas e em bom estado para vestir novos começos. Uma campanha fictícia de cuidado e solidariedade.",
        1,
        1,
      ],
      [
        "mesa",
        churchIds[1],
        "Mesa cheia, coração também",
        "Arroz, feijão, macarrão e outros alimentos não perecíveis, lacrados e dentro da validade.",
        3,
        1,
      ],
      [
        "brincar",
        churchIds[0],
        "Toda criança merece brincar",
        "Brinquedos completos e em bom estado para imaginar um mundo de possibilidades.",
        2,
        1,
      ],
      [
        "cuidado",
        churchIds[2],
        "Cuidado que se compartilha",
        "Campanha fictícia já encerrada. Obrigado por acompanhar este exemplo de mobilização.",
        1,
        0,
      ],
    ];
    campaigns.forEach((c) =>
      db
        .prepare(
          "INSERT OR IGNORE INTO campanhas (demo_key,igreja_id,titulo,descricao,categoria_id,ativa) VALUES (?,?,?,?,?,?)",
        )
        .run(...c),
    );
    const donationSeeds = [
      [
        "demo-1",
        1,
        churchIds[0],
        "PENDENTE",
        "COLETA",
        [
          [1, "Camisetas infantis", 5, "BOM_ESTADO", null],
          [2, "Jogos educativos completos", 2, "BOM_ESTADO", null],
        ],
      ],
      [
        "demo-2",
        1,
        churchIds[1],
        "ACEITA",
        "ENTREGA",
        [[3, "Pacotes de arroz lacrados", 4, "NOVO", "2028-12-31"]],
      ],
      [
        "demo-3",
        1,
        churchIds[0],
        "ACEITA",
        "COLETA",
        [[4, "Sabonetes embalados", 10, "NOVO", null]],
      ],
      [
        "demo-4",
        1,
        churchIds[2],
        "RECUSADA",
        "ENTREGA",
        [[1, "Casacos adultos", 3, "BOM_ESTADO", null]],
      ],
      [
        "demo-5",
        1,
        churchIds[0],
        "CONCLUIDA",
        "ENTREGA",
        [[2, "Livros de atividades e brinquedos", 6, "BOM_ESTADO", null]],
      ],
      [
        "demo-6",
        2,
        churchIds[2],
        "PENDENTE",
        "COLETA",
        [[3, "Feijão e macarrão", 8, "NOVO", "2028-12-31"]],
      ],
    ];
    donationSeeds.forEach(
      ([key, donor, church, status, mode, items], index) => {
        if (db.prepare("SELECT id FROM doacoes WHERE demo_key=?").get(key))
          return;
        const created = `2026-10-${String(20 + index).padStart(2, "0")}T12:00:00.000Z`;
        const id = Number(
          db
            .prepare(
              `INSERT INTO doacoes (demo_key,doador_demo_id,igreja_id,modalidade,status,endereco_coleta_ficticio,motivo_recusa,created_at) VALUES (?,?,?,?,?,?,?,?)`,
            )
            .run(
              key,
              donor,
              church,
              mode,
              status,
              mode === "COLETA"
                ? "Rua de Exemplo, 10 — endereço fictício"
                : null,
              status === "RECUSADA"
                ? "A campanha de casacos já foi atendida nesta demonstração."
                : null,
              created,
            ).lastInsertRowid,
        );
        items.forEach((item) =>
          db
            .prepare(
              "INSERT INTO itens_doacao (doacao_id,categoria_id,descricao,quantidade,condicao,validade) VALUES (?,?,?,?,?,?)",
            )
            .run(id, ...item),
        );
        const event = (tipo, desc) =>
          db
            .prepare(
              "INSERT INTO eventos_doacao (doacao_id,tipo,descricao,created_at) VALUES (?,?,?,?)",
            )
            .run(id, tipo, desc, created);
        event("PENDENTE", "Doação enviada para análise.");
        if (status !== "PENDENTE")
          event(
            status === "RECUSADA" ? "RECUSADA" : "ACEITA",
            status === "RECUSADA"
              ? "Solicitação recusada pela igreja."
              : "Solicitação aceita pela igreja.",
          );
        if (key === "demo-3" || status === "CONCLUIDA") {
          db.prepare(
            "INSERT INTO agendamentos (doacao_id,data,periodo,observacoes) VALUES (?,?,?,?)",
          ).run(
            id,
            status === "CONCLUIDA" ? "2026-10-26" : "2026-11-20",
            "MANHA",
            "Agendamento fictício do seed.",
          );
          event("AGENDADA", "Data e período combinados com a igreja.");
        }
        if (status === "CONCLUIDA")
          event("CONCLUIDA", "Recebimento confirmado pela igreja.");
      },
    );
    return {
      igrejas: churchIds.length,
      campanhas: campaigns.length,
      doacoes: donationSeeds.length,
    };
  });
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await import("dotenv/config");
  const db = createDatabase(process.env.SQLITE_PATH);
  console.log("Seed idempotente concluído:", seed(db));
  db.close();
}
