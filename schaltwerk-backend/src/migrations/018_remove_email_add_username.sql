-- Migration: E-Mail-Adressen entfernen, Benutzernamen hinzufügen
-- Diese Migration macht email optional und fügt username hinzu

-- 1. Füge username Spalte hinzu (zunächst nullable)
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(255);

-- 2. Migriere bestehende Daten: Konvertiere E-Mail-Adressen zu Benutzernamen
-- Extrahiere Benutzernamen aus E-Mail-Adressen (vor dem @)
UPDATE users 
SET username = LOWER(SPLIT_PART(email, '@', 1))
WHERE username IS NULL AND email IS NOT NULL;

-- 3. Für Benutzer ohne E-Mail oder mit ungültiger E-Mail: Verwende name als Fallback
UPDATE users 
SET username = LOWER(REPLACE(REPLACE(name, ' ', '_'), '.', '_'))
WHERE username IS NULL OR username = '';

-- 4. Mache username NOT NULL und UNIQUE
ALTER TABLE users 
  ALTER COLUMN username SET NOT NULL,
  ADD CONSTRAINT users_username_unique UNIQUE (username);

-- 5. Mache email optional (nullable)
ALTER TABLE users 
  ALTER COLUMN email DROP NOT NULL;

-- 6. Entferne den UNIQUE Constraint von email (falls vorhanden)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;

-- 7. Erstelle Index auf username
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 8. Optional: Entferne den Index auf email (wird nicht mehr benötigt)
-- DROP INDEX IF EXISTS idx_users_email;


