import { Link } from "react-router-dom";
import logo from "../../logos/Logo de Coração com Mãos Verdes.png";

export default function LandingBrand() {
  return (
    <Link className="landing-brand" to="/" aria-label="DoaES, início">
      <span className="landing-brand-mark">
        <img src={logo} alt="" width="1448" height="1086" />
      </span>
      <span>DoaES</span>
    </Link>
  );
}
