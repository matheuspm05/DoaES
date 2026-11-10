import { Link } from "react-router-dom";
import LandingBrand from "./LandingBrand";

export default function LandingFooter() {
  return (
    <footer className="landing-footer">
      <div className="landing-container">
        <div className="landing-footer-main">
          <LandingBrand />
          <p>
            Conectando solidariedade
            <br />
            no Espírito Santo.
          </p>
          <Link to="/#inicio">Voltar ao início ↑</Link>
        </div>
        <div className="landing-footer-bottom">
          <span>DoaES · Projeto acadêmico</span>
          <p>
            Modo demonstração · Instituições, pessoas e dados fictícios. O DoaES
            não realiza transporte.
          </p>
        </div>
      </div>
    </footer>
  );
}
