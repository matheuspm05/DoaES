import { RoleGate } from "../layouts/RoleGate";
import Dashboard from "../pages/shared/Dashboard";
import DonationDetail from "../pages/shared/DonationDetail";
import DonationHistory from "../pages/shared/DonationHistory";
import { ChurchSettings } from "../pages/church/ChurchSettings";
import { ManageCampaigns } from "../pages/church/ManageCampaigns";
import { CampaignEditor } from "../pages/church/CampaignEditor";

export const churchRoutes = [
  {
    path: "igreja",
    element: <RoleGate role="igreja" />,
    children: [
      { index: true, element: <Dashboard churchMode /> },
      { path: "configuracoes", element: <ChurchSettings /> },
      { path: "campanhas", element: <ManageCampaigns /> },
      { path: "campanhas/nova", element: <CampaignEditor /> },
      { path: "campanhas/:id/editar", element: <CampaignEditor /> },
      { path: "solicitacoes", element: <DonationHistory churchMode /> },
      { path: "solicitacoes/:id", element: <DonationDetail churchMode /> },
      {
        path: "solicitacoes/:id/agendar",
        element: <DonationDetail churchMode scheduling />,
      },
      {
        path: "agendamentos",
        element: <DonationHistory churchMode scheduling />,
      },
    ],
  },
];
