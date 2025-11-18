-- Users Tabelle
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  initialen VARCHAR(10) NOT NULL,
  rolle VARCHAR(20) NOT NULL CHECK (rolle IN ('admin', 'mitarbeiter')),
  berechtigungen JSONB DEFAULT '[]'::jsonb,
  avatar_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_rolle ON users(rolle);

