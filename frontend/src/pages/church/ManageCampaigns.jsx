import { useState } from "react";
import { Plus } from "lucide-react";
import { useDemo } from "../../contexts/demo";
import { PageHead, Button, CampaignCard, Empty } from "../../components/index";

export function ManageCampaigns() {
  const { campaigns, church } = useDemo();
  const [filter, setFilter] = useState("");
  const mine = campaigns.filter(
    (c) => c.igreja_id === church.id && (!filter || String(c.ativa) === filter),
  );
  return (
    <>
      <PageHead
        eyebrow="SOLIDARIEDADE EM MOVIMENTO"
        title="Suas campanhas, novos começos."
        description="Crie, edite e encerre campanhas fictícias. As mudanças aparecem nas páginas públicas."
        action={
          <Button to="/igreja/campanhas/nova">
            <Plus size={18} />
            Nova campanha
          </Button>
        }
      />
      <div className="filter-bar">
        <select
          aria-label="Filtrar campanhas"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">Todas as campanhas</option>
          <option value="true">Ativas</option>
          <option value="false">Encerradas</option>
        </select>
        <span className="micro">
          {mine.length} campanha(s) nesta igreja fictícia
        </span>
      </div>
      {mine.length ? (
        <div className="grid three">
          {mine.map((c) => (
            <CampaignCard key={c.id} campaign={c} manage />
          ))}
        </div>
      ) : (
        <Empty
          title="Toda campanha começa com uma ideia"
          description="Crie uma campanha para representar as necessidades desta igreja fictícia."
          action={
            <Button to="/igreja/campanhas/nova">Criar campanha demo</Button>
          }
        />
      )}
    </>
  );
}
