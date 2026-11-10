import { useState } from "react";
import { Save, UserRound, Church, ShieldCheck } from "lucide-react";
import { useDemo } from "../contexts/demo";
import { api } from "../services/api";
import { Button, PageHead, Field, ErrorMessage } from "../components/ui";

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
export function ChurchSettings() {
  const { church, categories, reload, notify } = useDemo();
  const [form, setForm] = useState({
      ...church,
      categorias: church.categorias.map((c) => c.id),
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const update = (k, v) => setForm({ ...form, [k]: v });
  async function save(e) {
    e.preventDefault();
    setError("");
    if (!form.categorias.length) {
      setError("Selecione ao menos uma categoria.");
      return;
    }
    setBusy(true);
    try {
      await api(`/igrejas/${church.id}`, { method: "PATCH", body: form });
      await reload();
      notify(
        "Configurações salvas no SQLite. As páginas públicas já mostram as alterações.",
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHead
        eyebrow="INSTITUIÇÃO FICTÍCIA"
        title="Perfil e condições de coleta"
        description="Defina como esta igreja demo recebe doações. As alterações são persistidas no SQLite."
      />
      <form className="card form-card settings-form" onSubmit={save}>
        <div className="profile-heading">
          <span className="large-avatar">
            <Church size={33} />
          </span>
          <div>
            <h2>Informações da igreja</h2>
            <p className="micro">Use apenas nomes e endereços fictícios.</p>
          </div>
        </div>
        <ErrorMessage>{error}</ErrorMessage>
        <div className="form-grid">
          <Field label="Nome fictício *" className="span-two">
            <input
              required
              maxLength={300}
              value={form.nome}
              onChange={(e) => update("nome", e.target.value)}
            />
          </Field>
          <Field label="Descrição *" className="span-two">
            <textarea
              required
              maxLength={2000}
              rows={4}
              value={form.descricao}
              onChange={(e) => update("descricao", e.target.value)}
            />
          </Field>
          <Field label="Cidade">
            <select
              value={form.cidade}
              onChange={(e) => update("cidade", e.target.value)}
            >
              <option>Vila Velha</option>
              <option>Vitória</option>
            </select>
          </Field>
          <Field label="Bairro fictício *">
            <input
              required
              maxLength={300}
              value={form.bairro}
              onChange={(e) => update("bairro", e.target.value)}
            />
          </Field>
          <Field label="Endereço público fictício *" className="span-two">
            <input
              required
              maxLength={300}
              value={form.endereco_publico_ficticio}
              onChange={(e) =>
                update("endereco_publico_ficticio", e.target.value)
              }
            />
          </Field>
        </div>
        <fieldset>
          <legend>Categorias aceitas *</legend>
          <div className="checkbox-grid">
            {categories.map((c) => (
              <label key={c.id}>
                <input
                  type="checkbox"
                  checked={form.categorias.includes(c.id)}
                  onChange={(e) =>
                    update(
                      "categorias",
                      e.target.checked
                        ? [...form.categorias, c.id]
                        : form.categorias.filter((id) => id !== c.id),
                    )
                  }
                />
                {c.nome}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Disponibilidade de coleta</legend>
          <label className="check-line">
            <input
              type="checkbox"
              checked={form.oferece_coleta}
              onChange={(e) => update("oferece_coleta", e.target.checked)}
            />
            Esta igreja oferece coleta com equipe própria
          </label>
          <p className="micro">
            Se desativada, novas doações só poderão escolher entrega presencial.
            Doações anteriores mantêm a modalidade combinada.
          </p>
        </fieldset>
        {form.oferece_coleta && (
          <Field label="Região fictícia atendida">
            <input
              maxLength={500}
              value={form.area_coleta}
              onChange={(e) => update("area_coleta", e.target.value)}
            />
          </Field>
        )}
        <Field label="Condições de coleta / entrega">
          <textarea
            maxLength={1000}
            value={form.condicoes_coleta}
            onChange={(e) => update("condicoes_coleta", e.target.value)}
          />
        </Field>
        <Button type="submit" disabled={busy}>
          <Save size={17} />
          {busy ? "Salvando…" : "Salvar configurações"}
        </Button>
      </form>
    </>
  );
}
