import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { DonationArt, Field, Button, ErrorMessage } from "../../components";
import { useAuth } from "../../contexts/auth";
export function Login() {
  const { login, mode, authLoading } = useAuth(),
    navigate = useNavigate();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  if (authLoading)
    return (
      <div className="container padded" role="status">
        Verificando sessão…
      </div>
    );
  if (mode) return <Navigate to={"/" + mode} replace />;
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const b = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const u = await login(b);
      navigate("/" + u.tipo.toLowerCase());
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container auth-grid">
      <section className="auth-story">
        <span className="eyebrow">BEM-VINDO AO DOAES</span>
        <h1>
          Cada doação
          <br />é uma <em>conexão.</em>
        </h1>
        <p>Aproxime-se de pessoas e boas causas.</p>
        <DonationArt />
      </section>
      <form className="card auth-card" onSubmit={submit}>
        <h2>Que bom ter você aqui.</h2>
        <p>Entre com sua conta para continuar.</p>
        <Field label="E-mail">
          <input
            type="email"
            name="email"
            autoComplete="username"
            required
            maxLength={150}
          />
        </Field>
        <Field label="Senha">
          <input
            type="password"
            name="senha"
            autoComplete="current-password"
            required
            maxLength={128}
          />
        </Field>
        <ErrorMessage>{error}</ErrorMessage>
        <Button type="submit" disabled={busy}>
          {busy ? "Entrando…" : "Entrar"}
        </Button>
        <div className="auth-links">
          Criar conta: <Link to="/cadastro/doador">Doador</Link> ·{" "}
          <Link to="/cadastro/igreja">Igreja</Link>
        </div>
        <p className="micro">
          Projeto acadêmico. Utilize informações fictícias.
        </p>
      </form>
    </div>
  );
}
