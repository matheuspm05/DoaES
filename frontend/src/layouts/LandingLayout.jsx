import { Outlet } from "react-router-dom";
import LandingHeader from "../components/landing/LandingHeader";
import LandingFooter from "../components/landing/LandingFooter";

export function LandingLayout() {
  return (
    <div className="landing-page">
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <LandingHeader />
      <main id="conteudo">
        <Outlet />
      </main>
      <LandingFooter />
    </div>
  );
}
