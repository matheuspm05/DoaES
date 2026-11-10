import { useState } from "react";
import { ArrowUpRight, Check, Mail, MapPin, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { Field } from "../index";

export default function LandingContact() {
  const [sent, setSent] = useState(false);
  function simulate(e) {
    e.preventDefault();
    e.currentTarget.reset();
    setSent(true);
  }
  return (
    <section
      className="landing-contact"
      id="contato"
      aria-labelledby="landing-contact-title"
    >
      <div className="landing-container landing-contact-grid">
        <div className="landing-contact-copy">
          <span className="eyebrow">VAMOS CONVERSAR</span>
          <h2 id="landing-contact-title">
            Boas conexões
            <br />
            começam com
            <br />
            <strong>uma conversa.</strong>
          </h2>
          <p>
            Quer conhecer melhor o DoaES ou entender como sua igreja pode
            participar? Este espaço mostra como seria esse primeiro contato.
          </p>
          <div className="landing-contact-location">
            <MapPin size={20} />
            <span>
              Vila Velha e Vitória
              <br />
              <small>Espírito Santo</small>
            </span>
          </div>
          <Link to="/cadastro/igreja" className="landing-church-link">
            Sou uma igreja e quero conhecer
            <ArrowUpRight size={20} />
          </Link>
        </div>
        <div className="landing-contact-card">
          <div className="landing-contact-card-title">
            <Mail size={22} />
            <h3>Fale com a gente</h3>
            <span>Modo demonstração</span>
          </div>
          <p className="landing-form-note">
            Use dados fictícios. Este formulário é uma simulação e não envia
            mensagens.
          </p>
          {sent && (
            <div className="landing-contact-success" role="status">
              <Check size={20} />
              <p>
                Simulação concluída! Nenhuma mensagem ou informação foi enviada
                ou armazenada.
              </p>
            </div>
          )}
          <form onSubmit={simulate}>
            <div className="landing-contact-fields">
              <Field label="Nome fictício">
                <input
                  required
                  name="nome"
                  maxLength={100}
                  autoComplete="off"
                  placeholder="Como podemos chamar você?"
                />
              </Field>
              <Field label="E-mail de exemplo">
                <input
                  required
                  type="email"
                  name="email"
                  maxLength={150}
                  autoComplete="off"
                  placeholder="voce@exemplo.invalid"
                />
              </Field>
            </div>
            <Field label="Assunto">
              <select name="assunto">
                <option>Quero conhecer o projeto</option>
                <option>Sou uma igreja</option>
                <option>Tenho uma sugestão</option>
              </select>
            </Field>
            <Field label="Sua mensagem demonstrativa">
              <textarea
                required
                name="mensagem"
                maxLength={1500}
                rows={4}
                placeholder="Escreva uma mensagem fictícia…"
              />
            </Field>
            <button
              className="landing-button landing-contact-submit"
              type="submit"
            >
              Simular envio
              <Send size={17} />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
