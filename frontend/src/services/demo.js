import { churchesApi } from "./api/churches";
import { campaignsApi } from "./api/campaigns";
import { donationsApi } from "./api/donations";
import { catalogApi } from "./api/catalog";

export async function loadDemoData() {
  const [churches, campaigns, categories, donations, donors] =
    await Promise.all([
      churchesApi.list(),
      campaignsApi.list(),
      catalogApi.categories(),
      donationsApi.list(),
      catalogApi.donors(),
    ]);
  return { churches, campaigns, categories, donations, donors };
}
