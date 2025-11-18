import jwt, { SignOptions } from "jsonwebtoken";
import { config } from "../config/env";

export interface JwtPayload {
  userId: string;
  email: string;
  rolle: string;
}

export function generateToken(payload: JwtPayload): string {
  // @ts-ignore - expiresIn kann string oder number sein
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, config.jwt.secret) as JwtPayload;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}

