import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Church,
  MapPin,
  Truck,
  Heart,
  CalendarCheck,
} from "lucide-react";
import {
  Button,
  PageHead,
  ChurchCard,
  CampaignCard,
  SearchField,
  Empty,
  SectionHead,
  CategoryIcon,
} from "../components/ui";
import { useDemo } from "../contexts/demo";

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
export function ChurchDetail() {
  const { id } = useParams();
  const { churches, campaigns } = useDemo();
  const church = churches.find((c) => c.id === Number(id));
  if (!church)
    return (
      <Empty
        title="Igreja não encontrada"
        action={<Button to="/igrejas">Explorar igrejas</Button>}
      />
    );
  const active = campaigns.filter((c) => c.igreja_id === church.id && c.ativa);
  return (
    <>
      <Link className="back-link" to="/igrejas">
        <ArrowLeft size={16} />
        Voltar para igrejas
      </Link>
      <div className="church-profile-banner">
        <span className="profile-church-icon">
          <Church size={54} strokeWidth={1.3} />
        </span>
        <div>
          <span className="eyebrow">INSTITUIÇÃO FICTÍCIA</span>
          <h1>{church.nome}</h1>
          <p>
            <MapPin size={16} />
            {church.bairro} · {church.cidade}, ES
          </p>
        </div>
        <Button to={`/doador/nova-doacao?igreja=${church.id}`}>
          Quero doar
          <Heart size={18} />
        </Button>
      </div>
      <div className="detail-grid">
        <div className="card padded">
          <h2>Um pouco sobre esta igreja</h2>
          <p>{church.descricao}</p>
          <h3>O que você pode doar</h3>
          <div className="accepted-categories">
            {church.categorias.map((c) => (
              <span key={c.id}>
                <CategoryIcon slug={c.slug} />
                {c.nome}
              </span>
            ))}
          </div>
          <h3>Endereço público fictício</h3>
          <p className="location">
            <MapPin size={17} />
            {church.endereco_publico_ficticio}
          </p>
          <p className="micro">
            Este endereço é ilustrativo. Não utilize para entregas reais.
          </p>
        </div>
        <aside className="card padded">
          <h2>Como sua doação chega</h2>
          <div className="delivery-info">
            <Truck />
            <div>
              <strong>
                {church.oferece_coleta
                  ? "Coleta pela própria igreja"
                  : "Apenas entrega presencial"}
              </strong>
              <p>
                {church.condicoes_coleta ||
                  "Entrega presencial mediante agendamento."}
              </p>
              {church.oferece_coleta && <small>{church.area_coleta}</small>}
            </div>
          </div>
          <div className="delivery-info">
            <CalendarCheck />
            <div>
              <strong>Sempre com agendamento</strong>
              <p>A igreja analisa os itens antes de combinar data e período.</p>
            </div>
          </div>
          <Button
            to={`/doador/nova-doacao?igreja=${church.id}`}
            className="full"
          >
            Iniciar minha doação
            <ArrowRight size={17} />
          </Button>
        </aside>
      </div>
      <SectionHead title="Campanhas desta igreja" />
      {active.length ? (
        <div className="grid three">
          {active.map((c) => (
            <CampaignCard key={c.id} campaign={c} />
          ))}
        </div>
      ) : (
        <Empty
          title="Sem campanhas ativas"
          description="Você ainda pode fazer uma doação diretamente para esta igreja."
        />
      )}
    </>
  );
}
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
export function CampaignDetail() {
  const { id } = useParams();
  const { campaigns } = useDemo();
  const c = campaigns.find((c) => c.id === Number(id));
  if (!c)
    return (
      <Empty
        title="Campanha não encontrada"
        action={<Button to="/campanhas">Ver campanhas</Button>}
      />
    );
  return (
    <>
      <Link className="back-link" to="/campanhas">
        <ArrowLeft size={16} />
        Voltar para campanhas
      </Link>
      <div className="campaign-detail">
        <div
          className={`campaign-art detail-art art-${c.categoria?.slug || "roupas"}`}
        >
          <span className="art-caption">
            CUIDADO QUE
            <br />
            SE COMPARTILHA.
          </span>
          <CategoryIcon slug={c.categoria?.slug} size={150} strokeWidth={1} />
          <span className="art-heart">♡</span>
        </div>
        <div className="card padded">
          <span className="eyebrow">
            CAMPANHA FICTÍCIA · {c.ativa ? "ATIVA" : "ENCERRADA"}
          </span>
          <h1>{c.titulo}</h1>
          <Link className="text-link" to={`/igrejas/${c.igreja_id}`}>
            <Church size={18} />
            {c.igreja.nome}
          </Link>
          <p>{c.descricao}</p>
          <div className="notice">
            <Heart size={20} />
            <p>
              {c.categoria?.nome || "Todas as categorias aceitas pela igreja"}.
              Doe itens em bom estado. Alimentos devem ser não perecíveis,
              lacrados e dentro da validade.
            </p>
          </div>
          {c.ativa ? (
            <Button
              to={`/doador/nova-doacao?igreja=${c.igreja_id}&campanha=${c.id}`}
            >
              Contribuir com esta campanha
              <ArrowRight size={18} />
            </Button>
          ) : (
            <Button to="/campanhas">Encontrar uma campanha ativa</Button>
          )}
        </div>
      </div>
    </>
  );
}
