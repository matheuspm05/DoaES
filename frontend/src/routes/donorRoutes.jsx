import { RoleGate } from "../layouts/RoleGate";
import Dashboard from "../pages/shared/Dashboard";
import DonationDetail from "../pages/shared/DonationDetail";
import DonationHistory from "../pages/shared/DonationHistory";
import NewDonation from "../pages/donor/NewDonation";
import { DonorProfile } from "../pages/donor/DonorProfile";

export const donorRoutes = [
  {
    path: "doador",
    element: <RoleGate role="doador" />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "nova-doacao", element: <NewDonation /> },
      { path: "doacoes/:id", element: <DonationDetail /> },
      { path: "acompanhar", element: <DonationHistory tracking /> },
      { path: "historico", element: <DonationHistory /> },
      { path: "perfil", element: <DonorProfile /> },
    ],
  },
];
