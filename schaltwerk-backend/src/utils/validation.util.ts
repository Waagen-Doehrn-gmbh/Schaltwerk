import { z } from "zod";

// Auth Validation
export const loginSchema = z.object({
  username: z.string().min(1, "Benutzername ist erforderlich"),
  password: z.string().min(6, "Passwort muss mindestens 6 Zeichen lang sein"),
});

export const registerSchema = z.object({
  username: z.string().min(3, "Benutzername muss mindestens 3 Zeichen lang sein").max(50, "Benutzername darf maximal 50 Zeichen lang sein"),
  password: z.string().min(6, "Passwort muss mindestens 6 Zeichen lang sein"),
  name: z.string().min(2, "Name muss mindestens 2 Zeichen lang sein"),
  initialen: z.string().min(2).max(10),
  rolle: z.enum(["admin", "analyse", "endabnahme", "technische_abnahme", "monteur"]),
  berechtigungen: z.array(z.enum(["abnahme", "endabnahme"])).optional(),
});

// Projekt Validation
export const createProjektSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  standort: z.string().min(1, "Standort ist erforderlich"),
  status: z.enum(["planung", "in_bearbeitung", "abgeschlossen"]),
  schaltschrankNummer: z.string().min(1, "Schaltschranknummer ist erforderlich"),
  komponentenIds: z.array(z.string().uuid()).optional(),
});

export const updateProjektSchema = createProjektSchema.partial();

// Protokoll Validation
export const createProtokollSchema = z.object({
  aufgabe: z.string().min(1, "Aufgabe ist erforderlich"),
  details: z.string().optional(),
  zeitaufwand: z.number().min(0, "Zeitaufwand muss >= 0 sein"),
  datum: z.string().datetime().optional(),
  projektId: z.string().uuid("Ungültige Projekt-ID"),
  abnahmeStatus: z.enum(["bestanden", "verweigert"]).optional(),
  abnahmeTyp: z.enum(["technisch", "endabnahme"]).optional(),
  checklisteStatus: z.enum(["abgeschlossen", "teilabschluss"]).optional(),
  abnahmeCheckliste: z.array(z.any()).optional(),
  abgeschlosseneKomponentenIds: z.array(z.string().uuid()).optional(),
});

export const updateProtokollSchema = createProtokollSchema.partial();

// Komponente Validation
export const createKomponenteSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  artikelNummer: z.string().min(1, "Artikelnummer ist erforderlich"),
  status: z.enum(["abgeschlossen", "ausstehend"]).optional(),
  projektId: z.string().uuid("Ungültige Projekt-ID").optional().or(z.literal("")),
  checklisteId: z.string().uuid().optional(),
});

export const updateKomponenteSchema = createKomponenteSchema.partial();

// Chat Validation
export const createChatMessageSchema = z.object({
  text: z.string().min(1, "Text ist erforderlich"),
  projektId: z.string().uuid("Ungültige Projekt-ID"),
  imageUrl: z.string().url().optional(),
});

// Checkliste Validation
export const createChecklisteSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  typ: z.enum(["allgemein", "komponenten"]),
  items: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      komponenteId: z.string().uuid().optional(),
      artikelNummer: z.string().optional(),
    })
  ),
});

export const updateChecklisteSchema = createChecklisteSchema.partial();

// Aufgabe Validation
export const createAufgabeSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  checklisteId: z.string().uuid().optional(),
  erforderlicheRolle: z.enum(["admin", "analyse", "endabnahme", "technische_abnahme", "monteur"]).optional(),
});

export const updateAufgabeSchema = createAufgabeSchema.partial();

// User Validation (für Admin)
export const createUserSchema = z.object({
  username: z.string().min(3, "Benutzername muss mindestens 3 Zeichen lang sein").max(50, "Benutzername darf maximal 50 Zeichen lang sein"),
  password: z.string().min(6, "Passwort muss mindestens 6 Zeichen lang sein"),
  name: z.string().min(2, "Name muss mindestens 2 Zeichen lang sein"),
  initialen: z.string().min(2, "Initialen müssen mindestens 2 Zeichen lang sein").max(10, "Initialen dürfen maximal 10 Zeichen lang sein"),
  rolle: z.enum(["admin", "analyse", "endabnahme", "technische_abnahme", "monteur"]),
  berechtigungen: z.array(z.enum(["abnahme", "endabnahme"])).optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

export const updateUserSchema = createUserSchema.partial().extend({
  password: z.string().min(6, "Passwort muss mindestens 6 Zeichen lang sein").optional(),
});

// Profile Update Schema (für Benutzer, die ihre eigenen Daten aktualisieren)
export const updateProfileSchema = z.object({
  name: z.string().min(2, "Name muss mindestens 2 Zeichen lang sein").optional(),
  initialen: z.string().min(2, "Initialen müssen mindestens 2 Zeichen lang sein").max(10, "Initialen dürfen maximal 10 Zeichen lang sein").optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

// Password Change Schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Aktuelles Passwort ist erforderlich"),
  newPassword: z.string().min(6, "Neues Passwort muss mindestens 6 Zeichen lang sein"),
});

