-- Migration: Komponenten projekt_id und status optional machen
-- Komponenten können ohne Projekt erstellt werden und werden später Projekten zugeordnet

ALTER TABLE komponenten 
  ALTER COLUMN projekt_id DROP NOT NULL,
  ALTER COLUMN status DROP NOT NULL;

-- Setze Standard-Status für bestehende Komponenten
UPDATE komponenten SET status = 'ausstehend' WHERE status IS NULL;


