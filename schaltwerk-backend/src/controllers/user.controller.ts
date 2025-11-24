import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { UserModel, CreateUserInput } from "../models/user.model";
import { AppError } from "../middleware/error.middleware";
import { createUserSchema, updateUserSchema } from "../utils/validation.util";

export class UserController {
  // Alle Benutzer abrufen (nur Admin)
  static async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const users = await UserModel.findAll();
      const publicUsers = users.map((user) => UserModel.toPublic(user));
      res.json(publicUsers);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Fehler beim Abrufen der Benutzer" });
    }
  }

  // Einzelnen Benutzer abrufen (nur Admin)
  static async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await UserModel.findById(id);
      if (!user) {
        res.status(404).json({ error: "Benutzer nicht gefunden" });
        return;
      }
      res.json(UserModel.toPublic(user));
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Fehler beim Abrufen des Benutzers" });
    }
  }

  // Neuen Benutzer erstellen (nur Admin)
  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = createUserSchema.parse(req.body);
      
      // Prüfe ob Benutzername bereits existiert
      const existingUser = await UserModel.findByUsername(data.username);
      if (existingUser) {
        res.status(400).json({ error: "Benutzername bereits vergeben" });
        return;
      }

      const user = await UserModel.create(data);
      res.status(201).json(UserModel.toPublic(user));
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      if (error.name === "ZodError") {
        res.status(400).json({ error: "Ungültige Eingabedaten", details: error.errors });
        return;
      }
      res.status(400).json({ error: error.message || "Fehler beim Erstellen des Benutzers" });
    }
  }

  // Benutzer aktualisieren (nur Admin)
  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = updateUserSchema.parse(req.body);

      // Prüfe ob Benutzer existiert
      const existingUser = await UserModel.findById(id);
      if (!existingUser) {
        res.status(404).json({ error: "Benutzer nicht gefunden" });
        return;
      }

      // Prüfe ob Benutzername bereits von anderem Benutzer verwendet wird
      if (data.username && data.username !== existingUser.username) {
        const usernameUser = await UserModel.findByUsername(data.username);
        if (usernameUser) {
          res.status(400).json({ error: "Benutzername bereits von anderem Benutzer verwendet" });
          return;
        }
      }

      // Konvertiere zu Partial<CreateUserInput> für UserModel.update
      const updateData: Partial<CreateUserInput> = {};
      if (data.username) updateData.username = data.username;
      if (data.name) updateData.name = data.name;
      if (data.initialen) updateData.initialen = data.initialen;
      if (data.rolle) updateData.rolle = data.rolle;
      if (data.berechtigungen !== undefined) updateData.berechtigungen = data.berechtigungen;
      if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
      if (data.password) updateData.password = data.password;

      const updatedUser = await UserModel.update(id, updateData);
      res.json(UserModel.toPublic(updatedUser));
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      if (error.name === "ZodError") {
        res.status(400).json({ error: "Ungültige Eingabedaten", details: error.errors });
        return;
      }
      res.status(400).json({ error: error.message || "Fehler beim Aktualisieren des Benutzers" });
    }
  }

  // Benutzer löschen (nur Admin)
  static async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Prüfe ob Benutzer existiert
      const existingUser = await UserModel.findById(id);
      if (!existingUser) {
        res.status(404).json({ error: "Benutzer nicht gefunden" });
        return;
      }

      // Verhindere, dass sich ein Admin selbst löscht
      if (req.user && req.user.id === id) {
        res.status(400).json({ error: "Sie können sich nicht selbst löschen" });
        return;
      }

      await UserModel.delete(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Fehler beim Löschen des Benutzers" });
    }
  }
}

