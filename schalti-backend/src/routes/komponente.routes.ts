import { Router } from "express";
import { KomponenteController } from "../controllers/komponente.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import {
  createKomponenteSchema,
  updateKomponenteSchema,
} from "../utils/validation.util";

const router = Router();

router.get("/", authMiddleware, KomponenteController.getAll);
router.get("/projekt/:projektId", authMiddleware, KomponenteController.getByProjekt);
router.get("/:id", authMiddleware, KomponenteController.getById);
router.post(
  "/",
  authMiddleware,
  validate(createKomponenteSchema),
  KomponenteController.create
);
router.put(
  "/:id",
  authMiddleware,
  validate(updateKomponenteSchema),
  KomponenteController.update
);
router.delete("/:id", authMiddleware, KomponenteController.delete);
router.get("/projekt/:projektId/status", authMiddleware, KomponenteController.getStatusByProjekt);
router.put(
  "/projekt/:projektId/:komponenteId/status",
  authMiddleware,
  KomponenteController.updateStatusInProjekt
);

export default router;

