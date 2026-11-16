import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Heart, Menu, X, RefreshCw, LogOut } from "lucide-react";
import { Logo, ErrorMessage } from "../components/index";
import { useAuth } from "../contexts/auth";
import { donorLinks } from "./navigation";
import { churchLinks } from "./navigation";

export function AppLayout() {
  const { mode, church, donor, logout, notify, reload, refreshing, error } =
    useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const isChurch = mode === "igreja";
  const links = isChurch ? churchLinks : donorLinks;
  return (
    <div className="app-shell">
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      {open && (
        <button
          className="nav-scrim"
          aria-label="Fechar navegação"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-logo">
          <Logo />
          <button
            className="icon-button mobile-menu"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
          >
            <X />
          </button>
        </div>
        <p className="nav-label">SEU ESPAÇO DE SOLIDARIEDADE</p>
        <nav aria-label="Painel">
          {links.map(([path, title, Icon]) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/doador" || path === "/igreja"}
              onClick={() => setOpen(false)}
            >
              <Icon size={19} />
              {title}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-note">
          <Heart size={22} />
          <strong>Cada gesto importa.</strong>
          <p>
            O DoaES conecta doações.
            <br />A coleta é feita pela igreja.
          </p>
          <span className="micro">Projeto acadêmico</span>
        </div>
        <button
          className="logout"
          onClick={() => {
            logout()
              .then(() => navigate("/"))
              .catch((e) => notify(e.message));
          }}
        >
          <LogOut size={17} />
          Sair da conta
        </button>
      </aside>
      <div className="workspace">
        <header className="app-header">
          <div className="header-breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="Abrir menu"
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              <Menu />
            </button>
            <span>
              DoaES <span className="slash">/</span>{" "}
              <strong>{isChurch ? "Igreja" : "Doador"}</strong>
            </span>
          </div>
          <div className="header-controls">
            <span className="demo-pill">
              <i />
              Projeto acadêmico
            </span>
            <button
              className="icon-button"
              aria-label="Atualizar dados"
              disabled={refreshing}
              onClick={() => reload().catch(() => {})}
            >
              <RefreshCw size={18} className={refreshing ? "spinning" : ""} />
            </button>
            <span className="avatar">
              {isChurch ? "IG" : donor?.nome.slice(0, 1)}
            </span>
          </div>
        </header>
        <main id="conteudo" className="app-main">
          <ErrorMessage>{error}</ErrorMessage>
          <Outlet key={isChurch ? church?.id : donor?.id} />
          <footer className="app-footer">
            DoaES · Projeto acadêmico{" "}
            <span>Dados fictícios para demonstração</span>
          </footer>
        </main>
      </div>
      <nav className="mobile-bottom" aria-label="Atalhos móveis">
        {[links[0], links[1], links[links.length - 1]].map(
          ([path, title, Icon]) => (
            <NavLink key={path} to={path} end>
              <Icon size={20} />
              <span>{title}</span>
            </NavLink>
          ),
        )}
      </nav>
    </div>
  );
}
