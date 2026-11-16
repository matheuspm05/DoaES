import { requireValue } from "../utils/errors.js";
import { requireAuth, role, ownDonation } from "../middleware/auth.js";
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
  router.use(requireAuth);
  router.param("id", (req, _res, next, id) => {
    ownDonation(db, req, id, req.method !== "GET" && req.method !== "HEAD");
    next();
  });
  router.get("/", (req, res) =>
    res.json(
      searchDonations(db, {
        ...req.query,
        doador_demo_id:
          req.user.tipo === "DOADOR" ? req.user.doador_id : undefined,
        igreja_id: req.user.tipo === "IGREJA" ? req.user.igreja_id : undefined,
      }),
    ),
  );
  router.get("/:id", (req, res) => res.json(getDonation(db, req.params.id)));
  router.post("/", role("DOADOR"), (req, res) => {
    requireValue(
      !req.body.doador_demo_id ||
        req.body.doador_demo_id === req.user.doador_id,
      "Identidade inválida.",
      403,
    );
    res
      .status(201)
      .json(
        createDonation(db, { ...req.body, doador_demo_id: req.user.doador_id }),
      );
  });
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
