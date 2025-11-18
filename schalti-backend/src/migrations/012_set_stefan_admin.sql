-- Migration: Stefan Admin-Rechte geben
-- Setzt die Rolle von Stefan Häring auf 'admin'

UPDATE users 
SET rolle = 'admin', 
    updated_at = CURRENT_TIMESTAMP
WHERE name ILIKE '%Stefan%' 
   OR email ILIKE '%stefan%';

