import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import landscape from "../../images/convento-n-s-da-penha.jpg";

export default function LandingHero() {
  return (
    <section
      className="landing-hero"
      id="inicio"
      aria-labelledby="landing-title"
    >
      <div className="landing-hero-photo">
        <img
          src={landscape}
          alt="Vista do Convento da Penha, da baía e da ponte entre Vila Velha e Vitória"
          width="1200"
          height="849"
          fetchPriority="high"
          decoding="async"
        />
      </div>
      <div className="landing-hero-wash" aria-hidden="true" />
      <div className="landing-container landing-hero-content">
        <h1 id="landing-title">
          Doações que
          <br />
          chegam a quem
          <br />
          <strong>realmente precisa.</strong>
        </h1>
        <p>
          Conectamos doadores a igrejas que realizam
          <br className="landing-desktop-break" /> ações sociais em Vila Velha e
          Vitória.
        </p>
        <Link className="landing-button landing-donate" to="/igrejas">
          Fazer uma doação
          <ArrowRight size={26} strokeWidth={1.8} />
        </Link>
      </div>
      <span className="landing-photo-caption">
        Vila Velha, ES · Imagem ilustrativa, sem vínculo institucional
      </span>
    </section>
  );
}
