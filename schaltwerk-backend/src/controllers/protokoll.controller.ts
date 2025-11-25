import { Response } from "express";
import { AuthRequest, kannTechnischeAbnahme, kannEndabnahme, hatRolleOderHoeher } from "../middleware/auth.middleware";
import { ProtokollService } from "../services/protokoll.service";
import { AufgabeService } from "../services/aufgabe.service";
import { AppError } from "../middleware/error.middleware";
import {
  createProtokollSchema,
  updateProtokollSchema,
} from "../utils/validation.util";

export class ProtokollController {
  static async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { projektId } = req.query;

      let protokolle;
      if (projektId && typeof projektId === "string") {
        protokolle = await ProtokollService.getProtokolleByProjekt(projektId);
      } else {
        protokolle = await ProtokollService.getAllProtokolle();
      }

      res.json(protokolle);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Fehler beim Abrufen der Protokolle" });
    }
  }

  static async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const protokoll = await ProtokollService.getProtokollById(id);

      if (!protokoll) {
        res.status(404).json({ error: "Protokoll nicht gefunden" });
        return;
      }

      res.json(protokoll);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Fehler beim Abrufen des Protokolls" });
    }
  }

  static async getByProjekt(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { projektId } = req.params;
      
      // Versuche zuerst nach Schaltschranknummer zu suchen (für URL-Routing)
      let protokolle = await ProtokollService.getProtokolleBySchaltschrankNummer(projektId);
      
      // Falls nicht gefunden, versuche es als UUID
      if (protokolle.length === 0) {
        protokolle = await ProtokollService.getProtokolleByProjekt(projektId);
      }
      
      res.json(protokolle);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Fehler beim Abrufen der Protokolle" });
    }
  }

  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Nicht authentifiziert" });
        return;
      }

      const data = createProtokollSchema.parse(req.body);
      
      // Dynamische Rollenprüfung: Lade Aufgabe aus DB und prüfe erforderliche Rolle
      const aufgabe = await AufgabeService.getAufgabeByName(data.aufgabe);
      if (aufgabe && aufgabe.erforderlicheRolle) {
        if (!hatRolleOderHoeher(req.user.rolle, aufgabe.erforderlicheRolle)) {
          res.status(403).json({ 
            error: `Zugriff verweigert - Diese Aufgabe erfordert mindestens die Rolle "${aufgabe.erforderlicheRolle}"` 
          });
          return;
        }
      }
      
      // Rückwärtskompatibilität: Prüfe auch alte Abnahme-Logik (falls abnahmeTyp gesetzt ist)
      if (data.abnahmeTyp === "technisch") {
        if (!kannTechnischeAbnahme(req.user.rolle)) {
          res.status(403).json({ error: "Zugriff verweigert - Keine Berechtigung für Technische Abnahme" });
          return;
        }
      }
      
      if (data.abnahmeTyp === "endabnahme") {
        if (!kannEndabnahme(req.user.rolle)) {
          res.status(403).json({ error: "Zugriff verweigert - Keine Berechtigung für Endabnahme" });
          return;
        }
      }

      const protokoll = await ProtokollService.createProtokoll({
        ...data,
        userId: req.user.id,
        datum: data.datum ? new Date(data.datum) : new Date(),
      });
      const protokollWithUser = await ProtokollService.getProtokollById(protokoll.id);
      
      // Webhook zu n8n senden (asynchron, nicht blockierend)
      if (process.env.N8N_WEBHOOK_URL) {
        fetch(`${process.env.N8N_WEBHOOK_URL}/protokoll`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ protokollId: protokoll.id }),
        }).catch((error) => {
          console.error("Fehler beim Senden des Webhooks zu n8n:", error);
        });
      }
      
      res.status(201).json(protokollWithUser || protokoll);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      res.status(400).json({ error: error.message || "Fehler beim Erstellen des Protokolls" });
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Nicht authentifiziert" });
        return;
      }

      const { id } = req.params;
      const data = updateProtokollSchema.parse(req.body);
      
      // Dynamische Rollenprüfung: Lade Aufgabe aus DB und prüfe erforderliche Rolle
      if (data.aufgabe) {
        const aufgabe = await AufgabeService.getAufgabeByName(data.aufgabe);
        if (aufgabe && aufgabe.erforderlicheRolle) {
          if (!hatRolleOderHoeher(req.user.rolle, aufgabe.erforderlicheRolle)) {
            res.status(403).json({ 
              error: `Zugriff verweigert - Diese Aufgabe erfordert mindestens die Rolle "${aufgabe.erforderlicheRolle}"` 
            });
            return;
          }
        }
      }
      
      // Rückwärtskompatibilität: Prüfe auch alte Abnahme-Logik (falls abnahmeTyp gesetzt ist)
      if (data.abnahmeTyp === "technisch") {
        if (!kannTechnischeAbnahme(req.user.rolle)) {
          res.status(403).json({ error: "Zugriff verweigert - Keine Berechtigung für Technische Abnahme" });
          return;
        }
      }
      
      if (data.abnahmeTyp === "endabnahme") {
        if (!kannEndabnahme(req.user.rolle)) {
          res.status(403).json({ error: "Zugriff verweigert - Keine Berechtigung für Endabnahme" });
          return;
        }
      }

      const protokoll = await ProtokollService.updateProtokoll(id, {
        ...data,
        datum: data.datum ? new Date(data.datum) : undefined,
      });
      const protokollWithUser = await ProtokollService.getProtokollById(protokoll.id);
      res.json(protokollWithUser || protokoll);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      res.status(400).json({ error: error.message || "Fehler beim Aktualisieren des Protokolls" });
    }
  }

  static async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await ProtokollService.deleteProtokoll(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Fehler beim Löschen des Protokolls" });
    }
  }
}

