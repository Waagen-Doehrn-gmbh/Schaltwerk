import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { ChatService } from "../services/chat.service";
import { AppError } from "../middleware/error.middleware";
import { createChatMessageSchema } from "../utils/validation.util";

export class ChatController {
  static async getByProjekt(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { projektId } = req.params;
      const messages = await ChatService.getMessagesByProjekt(projektId);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Fehler beim Abrufen der Nachrichten" });
    }
  }

  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Nicht authentifiziert" });
        return;
      }

      const data = createChatMessageSchema.parse(req.body);
      const message = await ChatService.createMessage({
        ...data,
        userId: req.user.id,
      });
      res.status(201).json(message);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      res.status(400).json({ error: error.message || "Fehler beim Erstellen der Nachricht" });
    }
  }

  static async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await ChatService.deleteMessage(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Fehler beim Löschen der Nachricht" });
    }
  }
}

