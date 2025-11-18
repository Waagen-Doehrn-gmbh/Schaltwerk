-- Migration: Rolle "analyse" hinzufügen
-- Fügt die neue Rolle "analyse" hinzu, die zwischen "admin" und "endabnahme" in der Hierarchie steht

-- CHECK-Constraint entfernen
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_rolle_check;

-- Neue CHECK-Constraint mit "analyse" Rolle hinzufügen
ALTER TABLE users 
ADD CONSTRAINT users_rolle_check 
CHECK (rolle IN ('admin', 'analyse', 'endabnahme', 'technische_abnahme', 'monteur'));

