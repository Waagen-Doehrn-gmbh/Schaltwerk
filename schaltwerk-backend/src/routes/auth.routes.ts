import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import { loginSchema, registerSchema, updateProfileSchema, changePasswordSchema } from "../utils/validation.util";

const router = Router();

router.post("/login", validate(loginSchema), AuthController.login);
router.post("/register", validate(registerSchema), AuthController.register);
router.post("/logout", authMiddleware, AuthController.logout);
router.get("/me", authMiddleware, AuthController.getMe);
router.put("/profile", authMiddleware, validate(updateProfileSchema), AuthController.updateProfile);
router.put("/password", authMiddleware, validate(changePasswordSchema), AuthController.changePassword);

export default router;

