-- Protokolle Tabelle
CREATE TABLE IF NOT EXISTS protokolle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aufgabe VARCHAR(255) NOT NULL,
  details TEXT,
  zeitaufwand DECIMAL(10, 2) NOT NULL,
  datum TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  projekt_id UUID NOT NULL REFERENCES projekte(id) ON DELETE CASCADE,
  abnahme_status VARCHAR(20) CHECK (abnahme_status IN ('bestanden', 'verweigert')),
  abnahme_typ VARCHAR(20) CHECK (abnahme_typ IN ('technisch', 'endabnahme')),
  checkliste_status VARCHAR(20) CHECK (checkliste_status IN ('abgeschlossen', 'teilabschluss')),
  abnahme_checkliste JSONB,
  abgeschlossene_komponenten_ids UUID[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_protokolle_projekt_id ON protokolle(projekt_id);
CREATE INDEX idx_protokolle_user_id ON protokolle(user_id);
CREATE INDEX idx_protokolle_datum ON protokolle(datum);

