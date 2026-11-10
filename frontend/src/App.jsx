import { BrowserRouter, Routes, Route } from "react-router-dom";
import DemoProvider from "./contexts/DemoProvider";
import {
  PublicLayout,
  RoleGate,
  BrowseLayout,
  ScrollTop,
} from "./layouts/Layouts";
import { Home, Login, Register } from "./pages/PublicPages";
import {
  Explore,
  ChurchDetail,
  Campaigns,
  CampaignDetail,
} from "./pages/BrowsePages";
import Dashboard from "./pages/Dashboard";
import DonationHistory from "./pages/DonationHistory";
import NewDonation from "./pages/NewDonation";
import DonationDetail from "./pages/DonationDetail";
import { DonorProfile, ChurchSettings } from "./pages/ProfilePages";
import { ManageCampaigns, CampaignEditor } from "./pages/ManageCampaigns";
import { Empty, Button } from "./components/ui";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <DemoProvider>
        <ScrollTop />
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="entrar" element={<Login />} />
            <Route path="cadastro/doador" element={<Register />} />
            <Route path="cadastro/igreja" element={<Register churchMode />} />
            <Route
              path="*"
              element={
                <div className="container not-found">
                  <Empty
                    title="Esse caminho ainda não existe"
                    description="Uma boa ação pode começar pela página inicial."
                    action={<Button to="/">Voltar ao início</Button>}
                  />
                </div>
              }
            />
          </Route>
          <Route element={<BrowseLayout />}>
            <Route path="igrejas" element={<Explore />} />
            <Route path="igrejas/:id" element={<ChurchDetail />} />
            <Route path="campanhas" element={<Campaigns />} />
            <Route path="campanhas/:id" element={<CampaignDetail />} />
          </Route>
          <Route path="doador" element={<RoleGate role="doador" />}>
            <Route index element={<Dashboard />} />
            <Route path="nova-doacao" element={<NewDonation />} />
            <Route path="doacoes/:id" element={<DonationDetail />} />
            <Route path="acompanhar" element={<DonationHistory tracking />} />
            <Route path="historico" element={<DonationHistory />} />
            <Route path="perfil" element={<DonorProfile />} />
          </Route>
          <Route path="igreja" element={<RoleGate role="igreja" />}>
            <Route index element={<Dashboard churchMode />} />
            <Route path="configuracoes" element={<ChurchSettings />} />
            <Route path="campanhas" element={<ManageCampaigns />} />
            <Route path="campanhas/nova" element={<CampaignEditor />} />
            <Route path="campanhas/:id/editar" element={<CampaignEditor />} />
            <Route
              path="solicitacoes"
              element={<DonationHistory churchMode />}
            />
            <Route
              path="solicitacoes/:id"
              element={<DonationDetail churchMode />}
            />
            <Route
              path="solicitacoes/:id/agendar"
              element={<DonationDetail churchMode scheduling />}
            />
            <Route
              path="agendamentos"
              element={<DonationHistory churchMode scheduling />}
            />
          </Route>
        </Routes>
      </DemoProvider>
    </BrowserRouter>
  );
}
