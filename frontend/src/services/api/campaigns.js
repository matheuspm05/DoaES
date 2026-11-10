import { request } from "../http";
export const campaignsApi = {
  list: () => request("/campanhas"),
  get: (id) => request(`/campanhas/${id}`),
  create: (body) => request("/campanhas", { method: "POST", body }),
  update: (id, body) => request(`/campanhas/${id}`, { method: "PATCH", body }),
};
