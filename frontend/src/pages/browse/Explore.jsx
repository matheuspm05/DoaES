import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Heart } from "lucide-react";
import {
  Button,
  PageHead,
  ChurchCard,
  SearchField,
  Empty,
} from "../../components/index";
import { useDemo } from "../../contexts/demo";

export function Explore() {
  const { churches, categories } = useDemo();
  const [params] = useSearchParams();
  const [search, setSearch] = useState(""),
    [city, setCity] = useState(""),
    [category, setCategory] = useState(params.get("categoria") || "");
  const filtered = churches.filter(
    (c) =>
      (!city || c.cidade === city) &&
      (!category || c.categorias.some((cat) => cat.id === Number(category))) &&
      c.nome
        .toLocaleLowerCase("pt-BR")
        .includes(search.toLocaleLowerCase("pt-BR")),
  );
  return (
    <>
      <PageHead
        eyebrow="ENCONTRE SEU PRÓXIMO GESTO"
        title="Boas causas perto de você."
        description="Conheça igrejas fictícias de Vila Velha e Vitória e descubra como ajudar."
      />
      <div className="filter-bar">
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Buscar pelo nome da igreja"
        />
        <select
          aria-label="Filtrar por cidade"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        >
          <option value="">Todas as cidades</option>
          <option>Vila Velha</option>
          <option>Vitória</option>
        </select>
        <select
          aria-label="Filtrar por categoria"
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
      <div className="results-line">
        <span>
          {filtered.length}{" "}
          {filtered.length === 1 ? "igreja encontrada" : "igrejas encontradas"}
        </span>
        <span>Instituições fictícias · Modo demonstração</span>
      </div>
      {filtered.length ? (
        <div className="grid three">
          {filtered.map((c) => (
            <ChurchCard key={c.id} church={c} />
          ))}
        </div>
      ) : (
        <Empty
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setSearch("");
                setCity("");
                setCategory("");
              }}
            >
              Limpar filtros
            </Button>
          }
        />
      )}
      <div className="notice spacious">
        <Heart size={23} />
        <p>
          O DoaES aproxima quem doa de quem recebe. Quando disponível, a coleta
          é realizada pela própria igreja.
        </p>
      </div>
    </>
  );
}
