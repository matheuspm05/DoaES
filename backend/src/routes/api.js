import { Router } from "express";
import { validateJson } from "../middleware/validateJson.js";
import { healthRoutes } from "./health.js";
import { catalogRoutes } from "./catalog.js";
import { churchRoutes } from "./churches.js";
import { campaignRoutes } from "./campaigns.js";
import { donationRoutes } from "./donations.js";

export function apiRoutes(db) {
  const router = Router();
  router.use(validateJson);
  router.use("/health", healthRoutes());
  router.use(catalogRoutes(db));
  router.use("/igrejas", churchRoutes(db));
  router.use("/campanhas", campaignRoutes(db));
  router.use("/doacoes", donationRoutes(db));
  router.use((_req, res) =>
    res.status(404).json({ erro: "Rota da API não encontrada." }),
  );
  return router;
}
