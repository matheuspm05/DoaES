import { Router } from "express";
import { listCategories } from "../repositories/catalog.js";
export function catalogRoutes(db) {
  const router = Router();
  router.get("/categorias", (_req, res) => res.json(listCategories(db)));

  return router;
}
