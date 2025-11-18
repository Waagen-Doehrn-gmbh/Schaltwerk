import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { AufgabeService } from "../services/aufgabe.service";
import { AppError } from "../middleware/error.middleware";
import {
  createAufgabeSchema,
  updateAufgabeSchema,
} from "../utils/validation.util";

export class AufgabeController {
  static async getAll(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const aufgaben = await AufgabeService.getAllAufgaben();
      res.json(aufgaben);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Fehler beim Abrufen der Aufgaben" });
    }
  }

  static async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const aufgabe = await AufgabeService.getAufgabeById(id);

      if (!aufgabe) {
        res.status(404).json({ error: "Aufgabe nicht gefunden" });
        return;
      }

      res.json(aufgabe);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Fehler beim Abrufen der Aufgabe" });
    }
  }

  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = createAufgabeSchema.parse(req.body);
      const aufgabe = await AufgabeService.createAufgabe(data);
      res.status(201).json(aufgabe);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      res.status(400).json({ error: error.message || "Fehler beim Erstellen der Aufgabe" });
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = updateAufgabeSchema.parse(req.body);
      const aufgabe = await AufgabeService.updateAufgabe(id, data);
      res.json(aufgabe);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      res.status(400).json({ error: error.message || "Fehler beim Aktualisieren der Aufgabe" });
    }
  }

  static async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await AufgabeService.deleteAufgabe(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Fehler beim Löschen der Aufgabe" });
    }
  }
}

