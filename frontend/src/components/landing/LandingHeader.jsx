import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import LandingBrand from "./LandingBrand";
import { useDemo } from "../../contexts/demo";

const links = [
  ["/#inicio", "Início"],
  ["/#campanhas", "Campanhas"],
  ["/#contato", "Contato"],
];

export default function LandingHeader() {
  const [open, setOpen] = useState(false);
  const { mode } = useDemo();
  const { hash } = useLocation();
  const close = () => setOpen(false);
  return (
    <header className="landing-header">
      <div className="landing-container landing-header-inner">
        <LandingBrand />
        <button
          className="landing-menu-toggle"
          type="button"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          aria-controls="landing-navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
        <nav
          className={`landing-navigation ${open ? "is-open" : ""}`}
          id="landing-navigation"
          aria-label="Principal"
          onKeyDown={(e) => {
            if (e.key === "Escape") close();
          }}
        >
          <div className="landing-nav-links">
            {links.map(([to, label]) => {
              const current = to.endsWith(hash || "#inicio");
              return (
                <Link
                  className={current ? "is-current" : ""}
                  aria-current={current ? "location" : undefined}
                  key={to}
                  to={to}
                  onClick={close}
                >
                  {label}
                </Link>
              );
            })}
          </div>
          <div className="landing-account-links">
            <Link
              className="landing-button is-outline"
              to={
                mode === "igreja"
                  ? "/igreja"
                  : mode === "doador"
                    ? "/doador"
                    : "/entrar"
              }
              onClick={close}
            >
              {mode ? "Meu painel" : "Entrar"}
            </Link>
            <Link
              className="landing-button"
              to="/cadastro/doador"
              onClick={close}
            >
              Cadastrar
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
