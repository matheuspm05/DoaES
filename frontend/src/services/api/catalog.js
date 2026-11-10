import { request } from "../http";
export const catalogApi = {
  categories: () => request("/categorias"),
  donors: () => request("/doadores-demo"),
};
