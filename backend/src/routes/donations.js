import { Router } from "express";
import { getDonation } from "../repositories/donations.js";
import {
  searchDonations,
  createDonation,
  decideDonation,
  scheduleDonation,
  receiveDonation,
} from "../services/donations.js";
export function donationRoutes(db) {
  const router = Router();
  router.get("/", (req, res) => res.json(searchDonations(db, req.query)));
  router.get("/:id", (req, res) => res.json(getDonation(db, req.params.id)));
  router.post("/", (req, res) =>
    res.status(201).json(createDonation(db, req.body)),
  );
  router.patch("/:id/decisao", (req, res) =>
    res.json(decideDonation(db, req.params.id, req.body)),
  );
  router.patch("/:id/agendamento", (req, res) =>
    res.json(scheduleDonation(db, req.params.id, req.body)),
  );
  router.patch("/:id/concluir", (req, res) =>
    res.json(receiveDonation(db, req.params.id)),
  );
  return router;
}
