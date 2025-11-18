import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.util";
import { UserModel } from "../models/user.model";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    rolle: string;
  };
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Kein Token bereitgestellt" });
      return;
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    const user = await UserModel.findById(payload.userId);
    if (!user) {
      res.status(401).json({ error: "Benutzer nicht gefunden" });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      rolle: user.rolle,
    };

    next();
  } catch (error) {
    res.status(401).json({ error: "Ungültiges oder abgelaufenes Token" });
  }
}

export function adminMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.rolle !== "admin") {
    res.status(403).json({ error: "Zugriff verweigert - Admin-Rechte erforderlich" });
    return;
  }
  next();
}

// Hilfsfunktionen für Rollenprüfungen
export function kannProjektAnlegen(rolle: string): boolean {
  return rolle === "admin";
}

export function kannTechnischeAbnahme(rolle: string): boolean {
  return rolle === "admin" || rolle === "technische_abnahme" || rolle === "endabnahme";
}

export function kannEndabnahme(rolle: string): boolean {
  return rolle === "admin" || rolle === "endabnahme";
}

// Middleware für Projekt-Erstellung (nur Admin)
export function projektAnlegenMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || !kannProjektAnlegen(req.user.rolle)) {
    res.status(403).json({ error: "Zugriff verweigert - Nur Administratoren können Projekte anlegen" });
    return;
  }
  next();
}

// Middleware für Technische Abnahme
export function technischeAbnahmeMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || !kannTechnischeAbnahme(req.user.rolle)) {
    res.status(403).json({ error: "Zugriff verweigert - Keine Berechtigung für Technische Abnahme" });
    return;
  }
  next();
}

// Middleware für Endabnahme
export function endabnahmeMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || !kannEndabnahme(req.user.rolle)) {
    res.status(403).json({ error: "Zugriff verweigert - Keine Berechtigung für Endabnahme" });
    return;
  }
  next();
}

