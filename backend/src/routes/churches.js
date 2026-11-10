import { Router } from "express";
import { listChurches, getChurch } from "../repositories/churches.js";
import { updateChurch } from "../services/churches.js";
export function churchRoutes(db) {
  const router = Router();
  router.get("/", (_req, res) => res.json(listChurches(db)));
  router.get("/:id", (req, res) => res.json(getChurch(db, req.params.id)));
  router.patch("/:id", (req, res) =>
    res.json(updateChurch(db, req.params.id, req.body)),
  );
  return router;
}
