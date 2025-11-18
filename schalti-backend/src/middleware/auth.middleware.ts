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
    // Try to get token from cookie first, then fallback to Authorization header
    let token: string | undefined = req.cookies?.auth_token;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      res.status(401).json({ error: "Kein Token bereitgestellt" });
      return;
    }

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

// Prüft ob ein Benutzer eine bestimmte Rolle oder höhere hat
export function hatRolleOderHoeher(userRolle: string, erforderlicheRolle: string): boolean {
  // Admin hat immer alle Berechtigungen
  if (userRolle === "admin") return true;
  
  // Wenn keine Rolle erforderlich ist, hat jeder Zugriff
  if (!erforderlicheRolle) return true;
  
  // Gleiche Rolle hat Zugriff
  if (userRolle === erforderlicheRolle) return true;
  
  // Hierarchie: admin > analyse > endabnahme > technische_abnahme > monteur
  const rollenHierarchie: Record<string, number> = {
    monteur: 1,
    technische_abnahme: 2,
    endabnahme: 3,
    analyse: 4,
    admin: 5,
  };
  
  const userLevel = rollenHierarchie[userRolle] || 0;
  const erforderlichLevel = rollenHierarchie[erforderlicheRolle] || 0;
  
  return userLevel >= erforderlichLevel;
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

// Prüft ob ein Benutzer mindestens die Rolle "analyse" hat
export function kannAnalyse(userRolle: string): boolean {
  return userRolle === "admin" || userRolle === "analyse";
}

// Middleware für Analyse-Zugriff
export function analyseMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || !kannAnalyse(req.user.rolle)) {
    res.status(403).json({ error: "Zugriff verweigert - Mindestens Rolle 'Analyse' erforderlich" });
    return;
  }
  next();
}

