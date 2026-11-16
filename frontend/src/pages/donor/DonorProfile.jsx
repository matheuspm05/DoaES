import { request } from "../../services/http";
import { useState } from "react";
import { Save, UserRound, ShieldCheck } from "lucide-react";
import { useAuth } from "../../contexts/auth";
import { Button, PageHead, Field } from "../../components/index";

export function DonorProfile() {
  const { donor, notify, reload } = useAuth();
  const [profile, setProfile] = useState(donor);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const update = (k, v) => setProfile({ ...profile, [k]: v });
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await request("/auth/profile", { method: "PATCH", body: profile });
      await reload();
      notify("Perfil salvo.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
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
              <span className="badge status-aceita">Doador</span>
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
          <p role="alert">{error}</p>
          <Button type="submit" disabled={busy}>
            <Save size={17} />
            Salvar alterações
          </Button>
        </form>
        <aside className="notice profile-notice">
          <ShieldCheck size={29} />
          <h2>Um espaço para experimentar.</h2>
          <p>
            Seu perfil é fictício. As alterações deste formulário ficam no
            SQLite, vinculadas à sua conta.
          </p>
          <p>
            Este é um projeto acadêmico. Utilize apenas informações fictícias.
          </p>
        </aside>
      </div>
    </>
  );
}
