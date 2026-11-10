import { Router } from "express";
import { listCategories, listDemoDonors } from "../repositories/catalog.js";
export function catalogRoutes(db) {
  const router = Router();
  router.get("/categorias", (_req, res) => res.json(listCategories(db)));
  router.get("/doadores-demo", (_req, res) => res.json(listDemoDonors(db)));
  return router;
}
