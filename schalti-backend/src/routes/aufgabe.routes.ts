import { Router } from "express";
import { AufgabeController } from "../controllers/aufgabe.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import {
  createAufgabeSchema,
  updateAufgabeSchema,
} from "../utils/validation.util";

const router = Router();

router.get("/", authMiddleware, AufgabeController.getAll);
router.get("/:id", authMiddleware, AufgabeController.getById);
router.post(
  "/",
  authMiddleware,
  validate(createAufgabeSchema),
  AufgabeController.create
);
router.put(
  "/:id",
  authMiddleware,
  validate(updateAufgabeSchema),
  AufgabeController.update
);
router.delete("/:id", authMiddleware, AufgabeController.delete);

export default router;

