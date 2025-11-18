-- Checklisten Tabelle
CREATE TABLE IF NOT EXISTS checklisten (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  typ VARCHAR(20) NOT NULL CHECK (typ IN ('technisch', 'endabnahme', 'allgemein')),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_checklisten_typ ON checklisten(typ);

