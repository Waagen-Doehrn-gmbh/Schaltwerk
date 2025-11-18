-- Projekte Tabelle
CREATE TABLE IF NOT EXISTS projekte (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  standort VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('planung', 'in_bearbeitung', 'abgeschlossen')),
  schaltschrank_nummer VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projekte_status ON projekte(status);
CREATE INDEX idx_projekte_created_at ON projekte(created_at);

