import { request } from "../http";
export const donationsApi = {
  list: () => request("/doacoes"),
  get: (id) => request(`/doacoes/${id}`),
  create: (body) => request("/doacoes", { method: "POST", body }),
  decide: (id, body) =>
    request(`/doacoes/${id}/decisao`, { method: "PATCH", body }),
  schedule: (id, body) =>
    request(`/doacoes/${id}/agendamento`, { method: "PATCH", body }),
  complete: (id) =>
    request(`/doacoes/${id}/concluir`, { method: "PATCH", body: {} }),
};
