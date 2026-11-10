import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

export function Logo() {
  return (
    <Link className="brand" to="/" aria-label="DoaES, início">
      <span className="brand-symbol">
        <Heart size={22} fill="currentColor" />
      </span>
      <span>
        doa<span>ES</span>
      </span>
    </Link>
  );
}
