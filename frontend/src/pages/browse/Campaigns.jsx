import { useState } from "react";
import {
  PageHead,
  CampaignCard,
  SearchField,
  Empty,
} from "../../components/index";
import { useDemo } from "../../contexts/demo";

export function Campaigns() {
  const { campaigns, categories } = useDemo();
  const [search, setSearch] = useState(""),
    [active, setActive] = useState("true"),
    [category, setCategory] = useState("");
  const filtered = campaigns.filter(
    (c) =>
      (!active || String(c.ativa) === active) &&
      (!category || c.categoria_id === Number(category)) &&
      `${c.titulo} ${c.igreja.nome}`
        .toLocaleLowerCase("pt-BR")
        .includes(search.toLocaleLowerCase("pt-BR")),
  );
  return (
    <>
      <PageHead
        eyebrow="SOLIDARIEDADE EM MOVIMENTO"
        title="Uma causa para chamar de sua."
        description="Encontre uma campanha fictícia e dê um novo destino ao que você pode compartilhar."
      />
      <div className="filter-bar">
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Buscar campanha ou igreja"
        />
        <select
          aria-label="Situação da campanha"
          value={active}
          onChange={(e) => setActive(e.target.value)}
        >
          <option value="true">Campanhas ativas</option>
          <option value="false">Campanhas encerradas</option>
          <option value="">Todas as campanhas</option>
        </select>
        <select
          aria-label="Categoria da campanha"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>
      <p className="results-line">
        {filtered.length} campanhas · Todas fictícias
      </p>
      {filtered.length ? (
        <div className="grid three">
          {filtered.map((c) => (
            <CampaignCard key={c.id} campaign={c} />
          ))}
        </div>
      ) : (
        <Empty />
      )}
    </>
  );
}
