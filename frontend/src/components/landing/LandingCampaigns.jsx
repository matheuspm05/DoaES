import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { CampaignCard, Empty } from "../index";
import { useDemo } from "../../contexts/demo";

export default function LandingCampaigns() {
  const { campaigns } = useDemo();
  const featured = campaigns.filter((c) => c.ativa).slice(0, 3);
  return (
    <section
      className="landing-campaigns"
      id="campanhas"
      aria-labelledby="landing-campaigns-title"
    >
      <div className="landing-container">
        <div className="landing-section-heading">
          <div>
            <span className="eyebrow">ENCONTRE UMA CAUSA</span>
            <h2 id="landing-campaigns-title">Uma boa ação começa por aqui.</h2>
          </div>
          <Link className="text-link" to="/campanhas">
            Todas as campanhas
            <ArrowRight size={17} />
          </Link>
        </div>
        {featured.length ? (
          <div className="landing-campaign-grid">
            {featured.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        ) : (
          <Empty
            title="Novas campanhas estão por vir"
            description="Enquanto isso, conheça as igrejas fictícias e as categorias que recebem."
            action={
              <Link className="landing-button" to="/igrejas">
                Explorar igrejas
                <ArrowRight size={17} />
              </Link>
            }
          />
        )}
        <p className="landing-data-note">
          Instituições e campanhas fictícias para demonstração acadêmica.
        </p>
      </div>
    </section>
  );
}
