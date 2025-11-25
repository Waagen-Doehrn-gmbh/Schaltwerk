-- Tabelle für Chat-Nachrichten "Gelesen"-Status
-- Speichert, wann ein User zuletzt die Nachrichten eines Projekts gelesen hat
CREATE TABLE IF NOT EXISTS chat_message_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  projekt_id UUID NOT NULL REFERENCES projekte(id) ON DELETE CASCADE,
  last_read_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, projekt_id)
);

CREATE INDEX idx_chat_message_reads_user_id ON chat_message_reads(user_id);
CREATE INDEX idx_chat_message_reads_projekt_id ON chat_message_reads(projekt_id);
CREATE INDEX idx_chat_message_reads_last_read_at ON chat_message_reads(last_read_at);

