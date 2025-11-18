import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { AuthService } from "../services/auth.service";
import { AppError } from "../middleware/error.middleware";
import { loginSchema, registerSchema, updateProfileSchema, changePasswordSchema } from "../utils/validation.util";
import { UserModel } from "../models/user.model";

export class AuthController {
  static async login(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log("Login request body:", JSON.stringify(req.body));
      console.log("Login request headers:", req.headers["content-type"]);
      
      // Body sollte bereits durch validate middleware validiert sein
      const { username, password } = req.body;
      console.log("Attempting login for username:", username);
      
      const result = await AuthService.login(username, password);
      res.json(result);
    } catch (error: any) {
      console.error("Login error:", error.message);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      res.status(401).json({ error: error.message || "Login fehlgeschlagen" });
    }
  }

  static async register(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = registerSchema.parse(req.body);
      const result = await AuthService.register(data);
      res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      res.status(400).json({ error: error.message || "Registrierung fehlgeschlagen" });
    }
  }

  static async getMe(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Nicht authentifiziert" });
        return;
      }

      const user = await AuthService.getCurrentUser(req.user.id);
      if (!user) {
        res.status(404).json({ error: "Benutzer nicht gefunden" });
        return;
      }

      const { passwordHash, ...publicUser } = user;
      res.json(publicUser);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Fehler beim Abrufen des Benutzers" });
    }
  }

  static async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Nicht authentifiziert" });
        return;
      }

      const data = updateProfileSchema.parse(req.body);
      const updatedUser = await UserModel.update(req.user.id, data);
      const { passwordHash, ...publicUser } = updatedUser;
      res.json(publicUser);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      if (error.name === "ZodError") {
        res.status(400).json({ error: "Ungültige Eingabedaten", details: error.errors });
        return;
      }
      res.status(400).json({ error: error.message || "Fehler beim Aktualisieren des Profils" });
    }
  }

  static async changePassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Nicht authentifiziert" });
        return;
      }

      const data = changePasswordSchema.parse(req.body);
      
      // Hole aktuellen Benutzer
      const user = await UserModel.findById(req.user.id);
      if (!user) {
        res.status(404).json({ error: "Benutzer nicht gefunden" });
        return;
      }

      // Prüfe aktuelles Passwort
      const isValid = await UserModel.verifyPassword(user, data.currentPassword);
      if (!isValid) {
        res.status(401).json({ error: "Aktuelles Passwort ist falsch" });
        return;
      }

      // Aktualisiere Passwort
      await UserModel.update(req.user.id, { password: data.newPassword });
      res.status(204).send();
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      if (error.name === "ZodError") {
        res.status(400).json({ error: "Ungültige Eingabedaten", details: error.errors });
        return;
      }
      res.status(400).json({ error: error.message || "Fehler beim Ändern des Passworts" });
    }
  }
}

