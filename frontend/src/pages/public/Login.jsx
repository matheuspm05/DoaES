import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Heart, Church, ShieldCheck } from "lucide-react";
import { DonationArt, Field } from "../../components/index";
import { useDemo } from "../../contexts/demo";

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
