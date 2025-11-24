import { Router } from "express";
import { ProjektController } from "../controllers/projekt.controller";
import { authMiddleware, projektAnlegenMiddleware, adminMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import {
  createProjektSchema,
  updateProjektSchema,
} from "../utils/validation.util";

const router = Router();

router.get("/", authMiddleware, ProjektController.getAll);
router.get("/:id", authMiddleware, ProjektController.getById);
router.post(
  "/",
  authMiddleware,
  projektAnlegenMiddleware,
  validate(createProjektSchema),
  ProjektController.create
);
router.put(
  "/:id",
  authMiddleware,
  projektAnlegenMiddleware,
  validate(updateProjektSchema),
  ProjektController.update
);
router.delete("/:id", authMiddleware, adminMiddleware, ProjektController.delete);

export default router;

