-- Migration: Erforderliche Rolle für Aufgaben
-- Fügt eine Spalte hinzu, um zu speichern, welche Rolle mindestens benötigt wird, um eine Aufgabe zu erstellen

ALTER TABLE aufgaben 
ADD COLUMN IF NOT EXISTS erforderliche_rolle VARCHAR(50) CHECK (erforderliche_rolle IN ('admin', 'analyse', 'endabnahme', 'technische_abnahme', 'monteur') OR erforderliche_rolle IS NULL);

-- Kommentar hinzufügen
COMMENT ON COLUMN aufgaben.erforderliche_rolle IS 'Mindestens erforderliche Rolle zum Erstellen eines Protokolls mit dieser Aufgabe. NULL = keine spezielle Rolle erforderlich';

-- Bestehende Abnahme-Aufgaben aktualisieren
UPDATE aufgaben 
SET erforderliche_rolle = 'technische_abnahme' 
WHERE name = 'Technische Abnahme';

UPDATE aufgaben 
SET erforderliche_rolle = 'endabnahme' 
WHERE name = 'Endabnahme';

