import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { ArrowRight, Menu, X } from "lucide-react";
import { Logo, Button } from "../components/index";
import { useDemo } from "../contexts/demo";

export function PublicLayout({ children }) {
  const [open, setOpen] = useState(false);
  const { mode } = useDemo();
  return (
    <>
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <header className="public-header">
        <div className="container header-inner">
          <Logo />
          <button
            className="icon-button mobile-menu"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
          <nav
            className={open ? "public-nav open" : "public-nav"}
            aria-label="Principal"
          >
            <Link to="/" onClick={() => setOpen(false)}>
              Início
            </Link>
            <Link to="/igrejas" onClick={() => setOpen(false)}>
              Explorar igrejas
            </Link>
            <Link to="/campanhas" onClick={() => setOpen(false)}>
              Campanhas
            </Link>
            <Button
              to={
                mode === "igreja"
                  ? "/igreja"
                  : mode === "doador"
                    ? "/doador"
                    : "/entrar"
              }
              onClick={() => setOpen(false)}
            >
              {mode ? "Meu painel" : "Entrar"}
              <ArrowRight size={16} />
            </Button>
          </nav>
        </div>
      </header>
      <main id="conteudo">{children || <Outlet />}</main>
      <footer className="public-footer container">
        <Logo />
        <p>
          Conectando solidariedade no Espírito Santo.
          <br />
          <small>Projeto acadêmico · Dados fictícios para demonstração</small>
        </p>
        <Link to="/entrar">
          Experimentar a demonstração <ArrowRight size={15} />
        </Link>
      </footer>
    </>
  );
}
