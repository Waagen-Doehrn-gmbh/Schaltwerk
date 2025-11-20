-- Sicherstellen, dass alle Checklisten den korrekten Typ haben
-- Diese Migration behebt das Problem, wenn alte Daten noch 'technisch' oder 'endabnahme' enthalten

-- Prüfe ob Constraint existiert und entferne ihn falls nötig
DO $$
BEGIN
  -- Entferne Constraint falls vorhanden
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'checklisten_typ_check'
  ) THEN
    ALTER TABLE checklisten DROP CONSTRAINT checklisten_typ_check;
  END IF;
END $$;

-- Migriere alle alten Werte zu 'allgemein'
UPDATE checklisten 
SET typ = 'allgemein' 
WHERE typ IN ('technisch', 'endabnahme') OR typ NOT IN ('allgemein', 'komponenten');

-- Füge den korrekten Constraint hinzu
ALTER TABLE checklisten 
ADD CONSTRAINT checklisten_typ_check 
CHECK (typ IN ('allgemein', 'komponenten'));

