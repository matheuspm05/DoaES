import PasswordInput from "../../components/ui/PasswordInput";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Field, PageHead, ErrorMessage } from "../../components";
import { useAuth } from "../../contexts/auth";
export function Register({ churchMode = false }) {
  const { register, categories, publicLoading, publicError, loadPublic } =
      useAuth(),
    navigate = useNavigate();
  const [cats, setCats] = useState([1]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setError("");
    const b = Object.fromEntries(new FormData(e.currentTarget));
    if (b.senha !== b.confirmacao_senha) {
      setError("As senhas não conferem.");
      return;
    }
    setBusy(true);
    try {
      const u = await register({
        ...b,
        tipo: churchMode ? "IGREJA" : "DOADOR",
        categorias: cats,
      });
      await loadPublic();
      navigate("/" + u.tipo.toLowerCase());
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container register-container">
      <PageHead
        eyebrow="FAÇA PARTE"
        title={
          churchMode
            ? "Juntos, podemos ir mais longe."
            : "Seu próximo gesto começa aqui."
        }
        description="Crie sua conta. Projeto acadêmico: utilize apenas informações fictícias."
      />
      <form className="card form-card" onSubmit={submit}>
        <h2>{churchMode ? "Cadastro de igreja" : "Cadastro de doador"}</h2>
        <div className="form-grid">
          <Field label={churchMode ? "Nome institucional" : "Nome"}>
            <input name="nome" required maxLength={120} />
          </Field>
          <Field label="E-mail">
            <input
              name="email"
              type="email"
              autoComplete="username"
              required
              maxLength={150}
            />
          </Field>
          <Field label="Senha">
            <PasswordInput
              name="senha"
              autoComplete="new-password"
              required
              minLength={10}
              maxLength={128}
            />
          </Field>
          <Field label="Confirmar senha">
            <PasswordInput
              name="confirmacao_senha"
              autoComplete="new-password"
              required
              minLength={10}
              maxLength={128}
            />
          </Field>
          <Field label="Cidade">
            <select name="cidade">
              <option>Vila Velha</option>
              <option>Vitória</option>
            </select>
          </Field>
          <Field label="Contato fictício">
            <input name="contato" maxLength={100} />
          </Field>
          {churchMode && (
            <>
              <Field label="Bairro fictício">
                <input name="bairro" required maxLength={300} />
              </Field>
              <Field label="Endereço institucional fictício">
                <input
                  name="endereco_publico_ficticio"
                  required
                  maxLength={300}
                />
              </Field>
            </>
          )}
        </div>
        {churchMode && (
          <fieldset>
            <legend>Categorias aceitas</legend>
            {publicLoading ? (
              <p>Carregando categorias…</p>
            ) : publicError ? (
              <>
                <p role="alert">{publicError}</p>
                <Button type="button" onClick={loadPublic}>
                  Tentar novamente
                </Button>
              </>
            ) : (
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
            )}
          </fieldset>
        )}
        <ErrorMessage>{error}</ErrorMessage>
        <div className="form-actions">
          <Button type="submit" disabled={busy}>
            {busy ? "Criando conta…" : "Criar conta"}
          </Button>
          <Link to="/entrar">Já tenho conta</Link>
        </div>
      </form>
    </div>
  );
}
