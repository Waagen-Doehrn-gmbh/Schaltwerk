export type Berechtigung = "abnahme" | "endabnahme";
export type UserRole = "admin" | "monteur" | "technische_abnahme" | "endabnahme";

export interface User {
  id: string;
  email?: string; // Optional für Rückwärtskompatibilität
  name: string;
  initialen: string;
  rolle: UserRole;
  berechtigungen?: Berechtigung[]; // Optionale Berechtigungen (für Rückwärtskompatibilität)
  avatarUrl?: string; // Optional: URL zum Avatar-Bild
}

export type ProjektStatus = "planung" | "in_bearbeitung" | "abgeschlossen";

export interface ProjektStats {
  stunden: number;
  eintraege: number;
  komponenten: number;
  gesamtKomponenten: number;
}

export interface Projekt {
  id: string;
  name: string;
  standort: string;
  status: ProjektStatus;
  createdAt: Date;
  stats: ProjektStats;
  schaltschrankNummer?: string; // Optionale Schaltschranknummer, frei vergeben
  komponentenIds: string[]; // IDs der zugeordneten Komponenten
}

export interface Arbeitsprotokoll {
  id: string;
  aufgabe: string;
  details?: string;
  zeitaufwand: number; // in Stunden
  datum: Date;
  userId: string;
  projektId: string;
  user?: User; // Optional, wird beim Join hinzugefügt
  abnahmeStatus?: AbnahmeStatus; // Nur bei Abnahme-Aufgaben
  abnahmeCheckliste?: AbnahmeChecklisteItem[]; // Nur bei Abnahme-Aufgaben
  abnahmeTyp?: "technisch" | "endabnahme"; // Typ der Abnahme
  checklisteStatus?: "abgeschlossen" | "teilabschluss"; // Status für allgemeine Checklisten
  abgeschlosseneKomponentenIds?: string[]; // Komponenten die über diese Checkliste abgeschlossen wurden
}

export type KomponentenStatus = "abgeschlossen" | "ausstehend";

export interface Komponente {
  id: string;
  name: string;
  artikelNummer: string;
  status: KomponentenStatus;
  projektId: string | null; // Kann null sein, wenn Komponente noch keinem Projekt zugeordnet ist
  checklisteId?: string; // Optional: ID der zugeordneten Checkliste für Komponenten-spezifische Hinweise
}

export interface ProtokollFormData {
  aufgabe: string;
  details: string;
  zeitaufwand: number;
  abnahmeStatus?: "bestanden" | "verweigert";
  abnahmeCheckliste?: AbnahmeChecklisteItem[];
  abnahmeTyp?: "technisch" | "endabnahme"; // Typ der Abnahme
  checklisteStatus?: "abgeschlossen" | "teilabschluss"; // Status für allgemeine Checklisten
  abgeschlosseneKomponentenIds?: string[]; // Komponenten die über diese Checkliste abgeschlossen wurden
}

export interface AbnahmeChecklisteItem {
  id: string;
  text: string;
  checked: boolean;
  bilder?: string[]; // Optional: Array von Bild-URLs (Data URLs oder Server-URLs)
  komponenteId?: string; // Optional: ID der zugeordneten Komponente
  artikelNummer?: string; // Optional: Artikelnummer zur Suche
}

export type AbnahmeStatus = "bestanden" | "verweigert";

// Checkliste Template (für Verwaltung)
export interface Checkliste {
  id: string;
  name: string;
  typ: "technisch" | "endabnahme" | "allgemein";
  items: Omit<AbnahmeChecklisteItem, "checked" | "bilder">[]; // Items ohne checked-Status und Bilder
}

export interface ChatMessage {
  id: string;
  text: string;
  userId: string;
  projektId: string;
  timestamp: Date;
  user?: User; // Optional, wird beim Join hinzugefügt
  imageUrl?: string; // Optional, URL zum Bild
}

// Aufgabe mit optionaler Checklisten-Zuordnung
export interface Aufgabe {
  id: string;
  name: string;
  checklisteId?: string; // Optional: ID der zugeordneten Checkliste
}

// Analyse Daten Interface
export interface AnalyseDaten {
  projektId: string;
  projektName: string;
  dauer: number; // Gesamtstunden
  effektivitaet: number; // Stunden pro Komponente
  komponentenFortschritt: number; // Prozent
  tageAktiv: number;
  durchschnittlicheStundenProTag: number;
}

