import { Router } from "express";
import { ProtokollController } from "../controllers/protokoll.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import {
  createProtokollSchema,
  updateProtokollSchema,
} from "../utils/validation.util";

const router = Router();

router.get("/", authMiddleware, ProtokollController.getAll);
router.get("/projekt/:projektId", authMiddleware, ProtokollController.getByProjekt);
router.get("/:id", authMiddleware, ProtokollController.getById);
router.post(
  "/",
  authMiddleware,
  validate(createProtokollSchema),
  ProtokollController.create
);
router.put(
  "/:id",
  authMiddleware,
  validate(updateProtokollSchema),
  ProtokollController.update
);
router.delete("/:id", authMiddleware, ProtokollController.delete);

export default router;

