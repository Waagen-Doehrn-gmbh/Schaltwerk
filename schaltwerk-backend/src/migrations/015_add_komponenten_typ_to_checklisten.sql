-- Füge den Typ 'komponenten' zu den Checklisten hinzu und entferne 'technisch' und 'endabnahme'
ALTER TABLE checklisten 
DROP CONSTRAINT IF EXISTS checklisten_typ_check;

-- Migriere bestehende Checklisten: technisch und endabnahme -> allgemein
UPDATE checklisten SET typ = 'allgemein' WHERE typ IN ('technisch', 'endabnahme');

ALTER TABLE checklisten 
ADD CONSTRAINT checklisten_typ_check 
CHECK (typ IN ('allgemein', 'komponenten'));

