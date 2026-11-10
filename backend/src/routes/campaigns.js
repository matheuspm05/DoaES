import { Router } from "express";
import { getCampaign } from "../repositories/campaigns.js";
import {
  searchCampaigns,
  createCampaign,
  updateCampaign,
} from "../services/campaigns.js";
export function campaignRoutes(db) {
  const router = Router();
  router.get("/", (req, res) => res.json(searchCampaigns(db, req.query)));
  router.get("/:id", (req, res) => res.json(getCampaign(db, req.params.id)));
  router.post("/", (req, res) =>
    res.status(201).json(createCampaign(db, req.body)),
  );
  router.patch("/:id", (req, res) =>
    res.json(updateCampaign(db, req.params.id, req.body)),
  );
  return router;
}
