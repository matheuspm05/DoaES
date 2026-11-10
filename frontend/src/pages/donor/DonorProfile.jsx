import { useState } from "react";
import { Save, UserRound, ShieldCheck } from "lucide-react";
import { useDemo } from "../../contexts/demo";
import { Button, PageHead, Field } from "../../components/index";

export function DonorProfile() {
  const { donor, notify } = useDemo();
  const [profile, setProfile] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem(`doaes.profile.${donor.id}`)) || donor
      );
    } catch {
      return donor;
    }
  });
  const update = (k, v) => setProfile({ ...profile, [k]: v });
  function save(e) {
    e.preventDefault();
    localStorage.setItem(`doaes.profile.${donor.id}`, JSON.stringify(profile));
    notify(
      "Informações fictícias salvas somente neste navegador. O perfil demo da API permanece predefinido.",
    );
  }
  return (
    <>
      <PageHead
        eyebrow="UM PERFIL, MUITAS POSSIBILIDADES"
        title="Meu perfil de doador"
        description="Personalize este exemplo com informações inventadas. Não use seus dados pessoais."
      />
      <div className="profile-grid">
        <form className="card form-card" onSubmit={save}>
          <div className="profile-heading">
            <span className="large-avatar">
              <UserRound size={32} />
            </span>
            <div>
              <h2>{donor.nome}</h2>
              <span className="badge status-aceita">
                Perfil fictício · Doador
              </span>
            </div>
          </div>
          <div className="form-grid">
            <Field label="Nome fictício *">
              <input
                required
                maxLength={120}
                value={profile.nome}
                onChange={(e) => update("nome", e.target.value)}
              />
            </Field>
            <Field label="E-mail de exemplo *">
              <input
                type="email"
                required
                maxLength={150}
                value={profile.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </Field>
            <Field label="Cidade">
              <select
                value={profile.cidade}
                onChange={(e) => update("cidade", e.target.value)}
              >
                <option>Vila Velha</option>
                <option>Vitória</option>
              </select>
            </Field>
            <Field label="Contato demonstrativo">
              <input
                maxLength={100}
                placeholder="Ex.: contato fictício"
                value={profile.contato || ""}
                onChange={(e) => update("contato", e.target.value)}
              />
            </Field>
          </div>
          <Button type="submit">
            <Save size={17} />
            Salvar alterações locais
          </Button>
        </form>
        <aside className="notice profile-notice">
          <ShieldCheck size={29} />
          <h2>Um espaço para experimentar.</h2>
          <p>
            Seu perfil é fictício. As alterações deste formulário ficam no
            armazenamento local do navegador, sem criar uma conta.
          </p>
          <p>
            O acesso demo não oferece autenticação nem proteção de dados
            pessoais. Não informe dados reais.
          </p>
        </aside>
      </div>
    </>
  );
}
