import { role, ownChurch } from "../middleware/auth.js";
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
  router.post("/", role("IGREJA"), (req, res) => {
    if (req.body.igreja_id) ownChurch(req, req.body.igreja_id);
    res
      .status(201)
      .json(createCampaign(db, { ...req.body, igreja_id: req.user.igreja_id }));
  });
  router.patch("/:id", role("IGREJA"), (req, res) => {
    ownChurch(req, getCampaign(db, req.params.id).igreja_id);
    res.json(updateCampaign(db, req.params.id, req.body));
  });
  return router;
}
