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

