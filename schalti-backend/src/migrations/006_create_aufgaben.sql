-- Aufgaben Tabelle
CREATE TABLE IF NOT EXISTS aufgaben (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  checkliste_id UUID REFERENCES checklisten(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_aufgaben_checkliste_id ON aufgaben(checkliste_id);

