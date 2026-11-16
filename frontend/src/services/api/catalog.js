import { request } from "../http";
export const catalogApi = {
  categories: () => request("/categorias"),
};
