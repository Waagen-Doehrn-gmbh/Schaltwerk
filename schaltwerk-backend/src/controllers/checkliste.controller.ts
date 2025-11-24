import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { ChecklisteService } from "../services/checkliste.service";
import { AppError } from "../middleware/error.middleware";
import {
  createChecklisteSchema,
  updateChecklisteSchema,
} from "../utils/validation.util";

export class ChecklisteController {
  static async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { typ } = req.query;

      let checklisten;
      if (typ && typeof typ === "string") {
        if (["allgemein", "komponenten"].includes(typ)) {
          checklisten = await ChecklisteService.getChecklistenByTyp(typ as any);
        } else {
          checklisten = await ChecklisteService.getAllChecklisten();
        }
      } else {
        checklisten = await ChecklisteService.getAllChecklisten();
      }

      res.json(checklisten);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Fehler beim Abrufen der Checklisten" });
    }
  }

  static async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const checkliste = await ChecklisteService.getChecklisteById(id);

      if (!checkliste) {
        res.status(404).json({ error: "Checkliste nicht gefunden" });
        return;
      }

      res.json(checkliste);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Fehler beim Abrufen der Checkliste" });
    }
  }

  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = createChecklisteSchema.parse(req.body);
      const checkliste = await ChecklisteService.createCheckliste(data);
      res.status(201).json(checkliste);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      res.status(400).json({ error: error.message || "Fehler beim Erstellen der Checkliste" });
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = updateChecklisteSchema.parse(req.body);
      const checkliste = await ChecklisteService.updateCheckliste(id, data);
      res.json(checkliste);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      res.status(400).json({ error: error.message || "Fehler beim Aktualisieren der Checkliste" });
    }
  }

  static async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await ChecklisteService.deleteCheckliste(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Fehler beim Löschen der Checkliste" });
    }
  }
}

