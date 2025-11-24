-- Komponenten Tabelle
CREATE TABLE IF NOT EXISTS komponenten (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  artikel_nummer VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('abgeschlossen', 'ausstehend')),
  projekt_id UUID NOT NULL REFERENCES projekte(id) ON DELETE CASCADE,
  checkliste_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_komponenten_projekt_id ON komponenten(projekt_id);
CREATE INDEX idx_komponenten_status ON komponenten(status);
CREATE INDEX idx_komponenten_artikel_nummer ON komponenten(artikel_nummer);

