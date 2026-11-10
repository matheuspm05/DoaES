import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button, Field, PageHead, ErrorMessage } from "../../components/index";
import { useDemo } from "../../contexts/demo";

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
