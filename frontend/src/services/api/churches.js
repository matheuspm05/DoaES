import { request } from "../http";
export const churchesApi = {
  list: () => request("/igrejas"),
  get: (id) => request(`/igrejas/${id}`),
  update: (id, body) => request(`/igrejas/${id}`, { method: "PATCH", body }),
};
