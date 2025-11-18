import { Router, Request, Response } from "express";
import { ProtokollService } from "../services/protokoll.service";
import { ChatService } from "../services/chat.service";
import { ProjektService } from "../services/projekt.service";

const router = Router();

// Webhook für n8n - Protokoll erstellt
router.post("/protokoll", async (req: Request, res: Response): Promise<void> => {
  try {
    const { protokollId } = req.body;
    
    if (!protokollId) {
      res.status(400).json({ error: "protokollId erforderlich" });
      return;
    }

    const protokoll = await ProtokollService.getProtokollById(protokollId);
    if (!protokoll) {
      res.status(404).json({ error: "Protokoll nicht gefunden" });
      return;
    }

    const projekt = await ProjektService.getProjektById(protokoll.projektId);
    
    // Sende Daten an n8n Webhook
    const webhookData = {
      aufgabe: protokoll.aufgabe,
      details: protokoll.details || "",
      zeitaufwand: protokoll.zeitaufwand,
      datum: protokoll.datum,
      projektName: projekt?.name || "Unbekannt",
      projektId: protokoll.projektId,
      schaltschrankNummer: projekt?.schaltschrankNummer || "",
      userName: protokoll.user?.name || "Unbekannt",
      userId: protokoll.userId,
      abnahmeStatus: protokoll.abnahmeStatus || null,
      abnahmeTyp: protokoll.abnahmeTyp || null,
      checklisteStatus: protokoll.checklisteStatus || null,
    };

    res.json(webhookData);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Fehler beim Abrufen der Protokoll-Daten" });
  }
});

// Webhook für n8n - Chat-Nachricht erstellt
router.post("/chat", async (req: Request, res: Response): Promise<void> => {
  try {
    const { messageId } = req.body;
    
    if (!messageId) {
      res.status(400).json({ error: "messageId erforderlich" });
      return;
    }

    const message = await ChatService.getMessageById(messageId);
    if (!message) {
      res.status(404).json({ error: "Nachricht nicht gefunden" });
      return;
    }

    const projekt = await ProjektService.getProjektById(message.projektId);
    
    const webhookData = {
      text: message.text,
      projektName: projekt?.name || "Unbekannt",
      projektId: message.projektId,
      schaltschrankNummer: projekt?.schaltschrankNummer || "",
      userName: message.user?.name || "Unbekannt",
      userId: message.userId,
      timestamp: message.timestamp,
      imageUrl: message.imageUrl || null,
    };

    res.json(webhookData);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Fehler beim Abrufen der Chat-Daten" });
  }
});

export default router;

