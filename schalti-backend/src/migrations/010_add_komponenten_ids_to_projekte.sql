-- Migration: komponenten_ids Spalte zu projekte Tabelle hinzufügen
-- Speichert die IDs der zugeordneten Komponenten als UUID Array

ALTER TABLE projekte 
  ADD COLUMN IF NOT EXISTS komponenten_ids UUID[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_projekte_komponenten_ids ON projekte USING GIN (komponenten_ids);

