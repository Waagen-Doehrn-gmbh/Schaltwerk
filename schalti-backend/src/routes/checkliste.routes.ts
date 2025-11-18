import { Router } from "express";
import { ChecklisteController } from "../controllers/checkliste.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import {
  createChecklisteSchema,
  updateChecklisteSchema,
} from "../utils/validation.util";

const router = Router();

router.get("/", authMiddleware, ChecklisteController.getAll);
router.get("/:id", authMiddleware, ChecklisteController.getById);
router.post(
  "/",
  authMiddleware,
  validate(createChecklisteSchema),
  ChecklisteController.create
);
router.put(
  "/:id",
  authMiddleware,
  validate(updateChecklisteSchema),
  ChecklisteController.update
);
router.delete("/:id", authMiddleware, ChecklisteController.delete);

export default router;

