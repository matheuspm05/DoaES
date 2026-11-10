import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowRight,
  Heart,
  Church,
  MapPin,
  HandHeart,
  ShieldCheck,
} from "lucide-react";
import {
  Button,
  CampaignCard,
  CategoryIcon,
  DonationArt,
  Field,
  PageHead,
  ErrorMessage,
} from "../components/ui";
import { useDemo } from "../contexts/demo";

export function Home() {
  const { campaigns, categories } = useDemo();
  const { hash } = useLocation();
  useEffect(() => {
    if (hash)
      document
        .getElementById(hash.slice(1))
        ?.scrollIntoView({ behavior: "smooth" });
  }, [hash]);
  return (
    <>
      <section className="home-hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow hero-kicker">
              <span />
              SOLIDARIEDADE QUE CONECTA
            </span>
            <h1>
              O que você doa
              <br />
              pode ser um
              <br />
              <em>novo começo.</em>
            </h1>
            <p>
              Conectamos quem quer ajudar a igrejas que fazem a diferença. Um
              gesto seu pode transformar o dia de alguém.
            </p>
            <div className="hero-actions">
              <Button to="/igrejas">
                Quero fazer uma doação
                <ArrowRight size={18} />
              </Button>
              <Button to="/cadastro/igreja" variant="secondary">
                Sou uma igreja
              </Button>
            </div>
            <span className="hero-location">
              <MapPin size={15} />
              Vila Velha e Vitória, Espírito Santo
            </span>
          </div>
          <div className="hero-visual">
            <span className="visual-orbit" />
            <div className="hero-art-card">
              <div className="art-topline">
                <span className="micro">
                  UM POUCO DE VOCÊ. MUITO PARA ALGUÉM.
                </span>
                <Heart size={20} />
              </div>
              <DonationArt />
              <div className="art-bottomline">
                <span className="icon-tile">
                  <HandHeart size={25} />
                </span>
                <div>
                  <strong>Boas ações ganham novos destinos.</strong>
                  <small>O próximo gesto pode ser o seu.</small>
                </div>
              </div>
            </div>
            <span className="floating-note">
              <span>♡</span>Juntos, a gente cuida.
            </span>
          </div>
        </div>
      </section>
      <section className="container steps-section" id="como-funciona">
        <div className="section-intro">
          <span className="eyebrow">SIMPLES DO COMEÇO AO RECOMEÇO</span>
          <h2>Doar faz bem. E é mais fácil do que parece.</h2>
        </div>
        <div className="grid three">
          {[
            [
              "01",
              "Encontre uma igreja",
              "Explore instituições fictícias e conheça as necessidades de cada campanha.",
            ],
            [
              "02",
              "Conte o que quer doar",
              "Adicione os itens, escolha a modalidade e envie sua intenção de doação.",
            ],
            [
              "03",
              "Combine e acompanhe",
              "A igreja analisa, agenda a coleta ou entrega e confirma o recebimento.",
            ],
          ].map(([n, t, d]) => (
            <article className="step-card" key={n}>
              <span>{n}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="category-section">
        <div className="container">
          <div className="section-intro">
            <span className="eyebrow">O QUE PODE VIRAR CUIDADO</span>
            <h2>Pequenos gestos, muitas possibilidades.</h2>
          </div>
          <div className="category-grid">
            {categories.map((c) => (
              <Link
                to={`/igrejas?categoria=${c.id}`}
                className="category-card"
                key={c.id}
              >
                <span className={`category-circle ${c.slug}`}>
                  <CategoryIcon slug={c.slug} size={29} />
                </span>
                <strong>{c.nome}</strong>
                <ArrowRight size={17} />
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="container home-campaigns">
        <div className="section-head">
          <div>
            <span className="eyebrow">ENCONTRE UMA CAUSA</span>
            <h2>Uma boa ação começa por aqui.</h2>
          </div>
          <Link className="text-link" to="/campanhas">
            Todas as campanhas
            <ArrowRight size={17} />
          </Link>
        </div>
        <div className="grid three">
          {campaigns
            .filter((c) => c.ativa)
            .slice(0, 3)
            .map((c) => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
        </div>
      </section>
      <section className="container">
        <div className="home-cta">
          <div>
            <span className="eyebrow">MAIS CONEXÕES, MAIS CUIDADO</span>
            <h2>Sua igreja também pode fazer parte.</h2>
            <p>Conheça como organizar campanhas e acompanhar doações.</p>
          </div>
          <Button to="/cadastro/igreja" variant="white">
            Conhecer o cadastro demo
            <ArrowRight size={17} />
          </Button>
        </div>
        <p className="demo-disclaimer">
          <ShieldCheck size={16} />
          Modo demonstração acadêmica. Todas as instituições, campanhas, pessoas
          e endereços são fictícios.
        </p>
      </section>
    </>
  );
}
export function Login() {
  const { churches, church, chooseChurch, chooseMode } = useDemo();
  const navigate = useNavigate();
  function enter(mode) {
    chooseMode(mode);
    navigate(mode === "igreja" ? "/igreja" : "/doador");
  }
  return (
    <div className="container auth-grid">
      <section className="auth-story">
        <span className="eyebrow">BEM-VINDO AO DOAES</span>
        <h1>
          Cada doação
          <br />é uma <em>conexão.</em>
        </h1>
        <p>Experimente os dois lados de um gesto de solidariedade.</p>
        <DonationArt />
        <span className="micro">
          Feito para aproximar pessoas e boas causas.
        </span>
      </section>
      <section className="card auth-card">
        <span className="demo-pill">
          <i />
          Acesso de demonstração
        </span>
        <h2>Que bom ter você aqui.</h2>
        <p>
          Escolha um perfil fictício para conhecer a plataforma. Você pode
          alternar a qualquer momento.
        </p>
        <button className="role-card" onClick={() => enter("doador")}>
          <span className="icon-tile">
            <Heart />
          </span>
          <span>
            <strong>Entrar como doador</strong>
            <small>Encontre uma causa e compartilhe cuidado.</small>
          </span>
          <ArrowRight size={20} />
        </button>
        <Field label="Igreja fictícia para testar">
          <select
            value={church?.id || ""}
            onChange={(e) => chooseChurch(e.target.value)}
          >
            {churches.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </Field>
        <button className="role-card" onClick={() => enter("igreja")}>
          <span className="icon-tile">
            <Church />
          </span>
          <span>
            <strong>Entrar como igreja</strong>
            <small>Gerencie campanhas e receba doações.</small>
          </span>
          <ArrowRight size={20} />
        </button>
        <div className="notice">
          <ShieldCheck size={19} />
          <p>
            Sem senha e sem conta real. Este acesso simulado não oferece
            autenticação ou privacidade de produção.
          </p>
        </div>
        <div className="auth-links">
          Conhecer os cadastros demonstrativos:
          <br />
          <Link to="/cadastro/doador">Doador</Link>
          <span>·</span>
          <Link to="/cadastro/igreja">Igreja</Link>
        </div>
      </section>
    </div>
  );
}
export function Register({ churchMode = false }) {
  const { chooseMode, categories, notify } = useDemo();
  const navigate = useNavigate();
  const [cats, setCats] = useState([1]);
  const [error, setError] = useState("");
  function submit(e) {
    e.preventDefault();
    if (churchMode && !cats.length) {
      setError("Selecione pelo menos uma categoria.");
      return;
    }
    chooseMode(churchMode ? "igreja" : "doador");
    notify(
      "Cadastro apenas demonstrativo. Você entrou com um perfil fictício predefinido; o formulário não foi enviado.",
    );
    navigate(churchMode ? "/igreja" : "/doador");
  }
  return (
    <div className="container register-container">
      <PageHead
        eyebrow="MODO DEMONSTRAÇÃO"
        title={
          churchMode
            ? "Juntos, podemos ir mais longe."
            : "Seu próximo gesto começa aqui."
        }
        description="Cadastro simulado: use somente informações inventadas. Nenhuma conta será criada."
      />
      <form className="card form-card" onSubmit={submit}>
        <h2>{churchMode ? "Cadastro de igreja" : "Cadastro de doador"}</h2>
        <div className="form-grid">
          <Field
            label={
              churchMode ? "Nome fictício da instituição" : "Nome fictício"
            }
          >
            <input
              required
              maxLength={120}
              placeholder={
                churchMode ? "Ex.: Igreja de Exemplo" : "Ex.: Maria Demo"
              }
            />
          </Field>
          <Field label="E-mail de exemplo">
            <input
              type="email"
              required
              placeholder="exemplo@exemplo.invalid"
            />
          </Field>
          <Field label="Cidade">
            <select>
              <option>Vila Velha</option>
              <option>Vitória</option>
            </select>
          </Field>
          <Field label="Contato fictício">
            <input
              required
              placeholder="Contato de demonstração"
              maxLength={100}
            />
          </Field>
        </div>
        {churchMode && (
          <>
            <fieldset>
              <legend>Categorias que recebe</legend>
              <div className="checkbox-grid">
                {categories.map((c) => (
                  <label key={c.id}>
                    <input
                      type="checkbox"
                      checked={cats.includes(c.id)}
                      onChange={(e) =>
                        setCats(
                          e.target.checked
                            ? [...cats, c.id]
                            : cats.filter((id) => id !== c.id),
                        )
                      }
                    />
                    {c.nome}
                  </label>
                ))}
              </div>
            </fieldset>
            <Field label="Condições de coleta">
              <textarea
                placeholder="Ex.: coleta pela própria igreja, em bairros fictícios, com agendamento."
                maxLength={1000}
              />
            </Field>
          </>
        )}
        <label className="check-line">
          <input type="checkbox" required />
          Entendo que este cadastro é simulado e devo usar dados fictícios.
        </label>
        <ErrorMessage>{error}</ErrorMessage>
        <div className="form-actions">
          <Button type="submit">
            Continuar no painel demo
            <ArrowRight size={17} />
          </Button>
          <Link to="/entrar">Já conheço a demonstração</Link>
        </div>
        <p className="micro">
          Ao continuar, será usado o perfil demo existente. Os campos acima não
          serão salvos.
        </p>
      </form>
    </div>
  );
}
