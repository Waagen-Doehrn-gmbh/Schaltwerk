-- Migration: Tabelle für projekt-spezifische Komponenten-Status
-- Ermöglicht, dass eine Komponente in verschiedenen Projekten unterschiedliche Status haben kann

CREATE TABLE IF NOT EXISTS projekt_komponenten (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projekt_id UUID NOT NULL REFERENCES projekte(id) ON DELETE CASCADE,
  komponente_id UUID NOT NULL REFERENCES komponenten(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'ausstehend' CHECK (status IN ('abgeschlossen', 'ausstehend')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(projekt_id, komponente_id)
);

CREATE INDEX idx_projekt_komponenten_projekt_id ON projekt_komponenten(projekt_id);
CREATE INDEX idx_projekt_komponenten_komponente_id ON projekt_komponenten(komponente_id);
CREATE INDEX idx_projekt_komponenten_status ON projekt_komponenten(status);

-- Migriere bestehende Daten: Erstelle Einträge für alle bestehenden Projekt-Komponenten-Verknüpfungen
-- Verwende den Status aus der komponenten Tabelle als Ausgangswert
INSERT INTO projekt_komponenten (projekt_id, komponente_id, status)
SELECT 
  p.id AS projekt_id,
  k.id AS komponente_id,
  COALESCE(k.status, 'ausstehend') AS status
FROM projekte p
CROSS JOIN LATERAL unnest(p.komponenten_ids) AS komponente_id
JOIN komponenten k ON k.id = komponente_id
ON CONFLICT (projekt_id, komponente_id) DO NOTHING;

