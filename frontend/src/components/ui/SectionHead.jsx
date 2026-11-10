import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function SectionHead({ title, to, link = "Ver todas" }) {
  return (
    <div className="section-head">
      <h2>{title}</h2>
      {to && (
        <Link className="text-link" to={to}>
          {link}
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}
