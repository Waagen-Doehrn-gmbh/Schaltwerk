import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import { createUserSchema, updateUserSchema } from "../utils/validation.util";

const router = Router();

// Alle Routes erfordern Authentifizierung und Admin-Rechte
router.use(authMiddleware);
router.use(adminMiddleware);

router.get("/", UserController.getAll);
router.get("/:id", UserController.getById);
router.post("/", validate(createUserSchema), UserController.create);
router.put("/:id", validate(updateUserSchema), UserController.update);
router.delete("/:id", UserController.delete);

export default router;

