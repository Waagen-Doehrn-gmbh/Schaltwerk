-- Migration: Update User Roles
-- Ändert die Rollen von 'admin'/'mitarbeiter' zu 'admin'/'monteur'/'technische_abnahme'/'endabnahme'

-- Zuerst die CHECK-Constraint entfernen
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_rolle_check;

-- Alte Rollen zu neuen Rollen migrieren
-- 'mitarbeiter' ohne spezielle Berechtigungen -> 'monteur'
UPDATE users 
SET rolle = 'monteur' 
WHERE rolle = 'mitarbeiter' 
  AND (berechtigungen IS NULL OR berechtigungen = '[]'::jsonb);

-- 'mitarbeiter' mit 'abnahme' Berechtigung -> 'technische_abnahme'
UPDATE users 
SET rolle = 'technische_abnahme',
    berechtigungen = berechtigungen - 'abnahme'  -- Entferne 'abnahme' aus Berechtigungen, da es jetzt die Rolle ist
WHERE rolle = 'mitarbeiter' 
  AND berechtigungen::text LIKE '%abnahme%'
  AND berechtigungen::text NOT LIKE '%endabnahme%';

-- 'mitarbeiter' mit 'endabnahme' Berechtigung -> 'endabnahme'
UPDATE users 
SET rolle = 'endabnahme',
    berechtigungen = berechtigungen - 'endabnahme'  -- Entferne 'endabnahme' aus Berechtigungen, da es jetzt die Rolle ist
WHERE rolle = 'mitarbeiter' 
  AND berechtigungen::text LIKE '%endabnahme%';

-- 'admin' bleibt 'admin' (keine Änderung nötig)

-- Neue CHECK-Constraint mit neuen Rollen hinzufügen
ALTER TABLE users 
ADD CONSTRAINT users_rolle_check 
CHECK (rolle IN ('admin', 'monteur', 'technische_abnahme', 'endabnahme'));

