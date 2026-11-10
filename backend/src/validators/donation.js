import { find } from "../repositories/records.js";
import { acceptsCategory } from "../repositories/churches.js";
import { requireValue } from "../utils/errors.js";
import { text } from "../utils/validation.js";
import { date, today } from "../utils/dates.js";

export function validateDonation(db, body) {
  const igreja = find(db, "igrejas", body.igreja_id),
    donor = find(db, "doadores_demo", body.doador_demo_id);
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
  const campaign = body.campanha_id
    ? find(db, "campanhas", body.campanha_id)
    : null;
  if (campaign)
    requireValue(
      campaign.igreja_id === igreja.id && campaign.ativa,
      "A campanha precisa estar ativa e pertencer à igreja escolhida.",
    );
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
      acceptsCategory(db, igreja.id, category.id),
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
