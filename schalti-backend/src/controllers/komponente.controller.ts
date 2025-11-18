import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { KomponenteService } from "../services/komponente.service";
import { AppError } from "../middleware/error.middleware";
import { ProjektKomponenteModel } from "../models/projekt-komponente.model";
import {
  createKomponenteSchema,
  updateKomponenteSchema,
} from "../utils/validation.util";

export class KomponenteController {
  static async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { projektId, status } = req.query;

      let komponenten;
      if (projektId && typeof projektId === "string") {
        komponenten = await KomponenteService.getKomponentenByProjekt(projektId);
      } else if (status && typeof status === "string") {
        if (["abgeschlossen", "ausstehend"].includes(status)) {
          komponenten = await KomponenteService.getKomponentenByStatus(status as any);
        } else {
          komponenten = await KomponenteService.getAllKomponenten();
        }
      } else {
        komponenten = await KomponenteService.getAllKomponenten();
      }

      res.json(komponenten);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Fehler beim Abrufen der Komponenten" });
    }
  }

  static async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const komponente = await KomponenteService.getKomponenteById(id);

      if (!komponente) {
        res.status(404).json({ error: "Komponente nicht gefunden" });
        return;
      }

      res.json(komponente);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Fehler beim Abrufen der Komponente" });
    }
  }

  static async getByProjekt(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { projektId } = req.params;
      const komponenten = await KomponenteService.getKomponentenByProjekt(projektId);
      res.json(komponenten);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Fehler beim Abrufen der Komponenten" });
    }
  }

  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = createKomponenteSchema.parse(req.body);
      const komponente = await KomponenteService.createKomponente(data);
      res.status(201).json(komponente);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      res.status(400).json({ error: error.message || "Fehler beim Erstellen der Komponente" });
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = updateKomponenteSchema.parse(req.body);
      const komponente = await KomponenteService.updateKomponente(id, data);
      res.json(komponente);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      res.status(400).json({ error: error.message || "Fehler beim Aktualisieren der Komponente" });
    }
  }

  static async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await KomponenteService.deleteKomponente(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Fehler beim Löschen der Komponente" });
    }
  }

  // Projekt-spezifischer Status-Update
  static async updateStatusInProjekt(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { projektId, komponenteId } = req.params;
      const { status } = req.body;

      if (!status || !["abgeschlossen", "ausstehend"].includes(status)) {
        res.status(400).json({ error: "Ungültiger Status. Muss 'abgeschlossen' oder 'ausstehend' sein." });
        return;
      }

      const projektKomponente = await KomponenteService.updateKomponenteStatusInProjekt(
        projektId,
        komponenteId,
        status as "abgeschlossen" | "ausstehend"
      );
      res.json(projektKomponente);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Fehler beim Aktualisieren des Komponenten-Status" });
    }
  }

  // Lade alle Status für ein Projekt
  static async getStatusByProjekt(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { projektId } = req.params;
      const projektKomponenten = await ProjektKomponenteModel.findByProjekt(projektId);
      
      // Konvertiere zu einem Map für einfachen Zugriff
      const statusMap: Record<string, "abgeschlossen" | "ausstehend"> = {};
      projektKomponenten.forEach((pk) => {
        statusMap[pk.komponenteId] = pk.status;
      });
      
      res.json(statusMap);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Fehler beim Abrufen der Komponenten-Status" });
    }
  }
}

