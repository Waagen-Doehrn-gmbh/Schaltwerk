import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { ChatService } from "../services/chat.service";
import { ProjektService } from "../services/projekt.service";
import { AppError } from "../middleware/error.middleware";
import { createChatMessageSchema } from "../utils/validation.util";

export class ChatController {
  static async getByProjekt(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { projektId } = req.params;
      
      // Versuche zuerst nach Schaltschranknummer zu suchen (für URL-Routing)
      let messages = await ChatService.getMessagesBySchaltschrankNummer(projektId);
      let actualProjektId = projektId;
      
      // Falls nicht gefunden, versuche es als UUID
      if (messages.length === 0) {
        messages = await ChatService.getMessagesByProjekt(projektId);
        actualProjektId = projektId;
      } else {
        // Finde die tatsächliche Projekt-ID für lastReadAt
        const projektResult = await ProjektService.getProjektBySchaltschrankNummer(projektId);
        if (projektResult) {
          actualProjektId = projektResult.id;
        }
      }
      
      // Hole last_read_at für den aktuellen User
      let lastReadAt: Date | null = null;
      if (req.user) {
        lastReadAt = await ChatService.getLastReadAt(req.user.id, actualProjektId);
      }
      
      res.json({ messages, lastReadAt });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Fehler beim Abrufen der Nachrichten" });
    }
  }

  static async markAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Nicht authentifiziert" });
        return;
      }

      const { projektId } = req.params;
      
      // Versuche zuerst nach Schaltschranknummer zu suchen
      let actualProjektId = projektId;
      const projektResult = await ProjektService.getProjektBySchaltschrankNummer(projektId);
      if (projektResult) {
        actualProjektId = projektResult.id;
      }
      
      await ChatService.markMessagesAsRead(req.user.id, actualProjektId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Fehler beim Markieren der Nachrichten" });
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
      
      // Webhook zu n8n senden (asynchron, nicht blockierend)
      if (process.env.N8N_WEBHOOK_URL) {
        fetch(`${process.env.N8N_WEBHOOK_URL}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageId: message.id }),
        }).catch((error) => {
          console.error("Fehler beim Senden des Webhooks zu n8n:", error);
        });
      }
      
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

  static async clearAllByProjekt(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.rolle !== "admin") {
        res.status(403).json({ error: "Zugriff verweigert - Admin-Rechte erforderlich" });
        return;
      }

      const { projektId } = req.params;
      
      // Versuche zuerst nach Schaltschranknummer zu suchen
      let actualProjektId = projektId;
      const projektResult = await ProjektService.getProjektBySchaltschrankNummer(projektId);
      if (projektResult) {
        actualProjektId = projektResult.id;
      } else {
        // Prüfe ob es eine gültige UUID ist
        const projektById = await ProjektService.getProjektById(projektId);
        if (!projektById) {
          res.status(404).json({ error: "Projekt nicht gefunden" });
          return;
        }
        actualProjektId = projektId;
      }

      const deletedCount = await ChatService.deleteAllByProjekt(actualProjektId);
      res.json({ message: "Chat-Nachrichten gelöscht", deletedCount });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Fehler beim Löschen der Chat-Nachrichten" });
    }
  }
}

