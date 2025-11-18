import { Router } from "express";
import { ChatController } from "../controllers/chat.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import { createChatMessageSchema } from "../utils/validation.util";

const router = Router();

router.get("/projekt/:projektId", authMiddleware, ChatController.getByProjekt);
router.post(
  "/",
  authMiddleware,
  validate(createChatMessageSchema),
  ChatController.create
);
router.delete("/:id", authMiddleware, ChatController.delete);

export default router;

