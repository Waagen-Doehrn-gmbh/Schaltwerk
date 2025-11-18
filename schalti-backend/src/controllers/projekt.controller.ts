import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { ProjektService } from "../services/projekt.service";
import { AppError } from "../middleware/error.middleware";
import {
  createProjektSchema,
  updateProjektSchema,
} from "../utils/validation.util";

export class ProjektController {
  static async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { status } = req.query;
      let projekte;

      if (status && typeof status === "string") {
        if (["planung", "in_bearbeitung", "abgeschlossen"].includes(status)) {
          projekte = await ProjektService.getProjekteByStatus(status as any);
        } else {
          projekte = await ProjektService.getAllProjekte();
        }
      } else {
        projekte = await ProjektService.getAllProjekte();
      }

      // Füge Stats zu jedem Projekt hinzu
      const projekteWithStats = await Promise.all(
        projekte.map(async (projekt) => {
          const stats = await ProjektService.getProjektById(projekt.id);
          // Stelle sicher, dass komponentenIds nicht verloren geht
          if (stats) {
            return { ...stats, komponentenIds: stats.komponentenIds || projekt.komponentenIds || [] };
          }
          return projekt;
        })
      );

      res.json(projekteWithStats);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Fehler beim Abrufen der Projekte" });
    }
  }

  static async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const projekt = await ProjektService.getProjektById(id);

      if (!projekt) {
        res.status(404).json({ error: "Projekt nicht gefunden" });
        return;
      }

      res.json(projekt);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Fehler beim Abrufen des Projekts" });
    }
  }

  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = createProjektSchema.parse(req.body);
      const projekt = await ProjektService.createProjekt(data);
      const projektWithStats = await ProjektService.getProjektById(projekt.id);
      res.status(201).json(projektWithStats || projekt);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      res.status(400).json({ error: error.message || "Fehler beim Erstellen des Projekts" });
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = updateProjektSchema.parse(req.body);
      const projekt = await ProjektService.updateProjekt(id, data);
      const projektWithStats = await ProjektService.getProjektById(projekt.id);
      res.json(projektWithStats || projekt);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      res.status(400).json({ error: error.message || "Fehler beim Aktualisieren des Projekts" });
    }
  }

  static async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await ProjektService.deleteProjekt(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Fehler beim Löschen des Projekts" });
    }
  }
}

