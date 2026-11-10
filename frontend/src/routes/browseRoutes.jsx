import { BrowseLayout } from "../layouts/BrowseLayout";
import { Explore } from "../pages/browse/Explore";
import { ChurchDetail } from "../pages/browse/ChurchDetail";
import { Campaigns } from "../pages/browse/Campaigns";
import { CampaignDetail } from "../pages/browse/CampaignDetail";

export const browseRoutes = [
  {
    element: <BrowseLayout />,
    children: [
      { path: "igrejas", element: <Explore /> },
      { path: "igrejas/:id", element: <ChurchDetail /> },
      { path: "campanhas", element: <Campaigns /> },
      { path: "campanhas/:id", element: <CampaignDetail /> },
    ],
  },
];
