# Lokale Entwicklung - SchaltWerk

Diese Anleitung beschreibt, wie Sie die Anwendung lokal ohne Docker entwickeln können.

## Voraussetzungen

- Node.js 20 oder höher
- npm oder yarn
- PostgreSQL 16 (lokal installiert oder via Docker nur für DB)
- Git

## Setup

### 1. PostgreSQL Datenbank

**Option A: PostgreSQL lokal installiert**
- Installieren Sie PostgreSQL 16 auf Ihrem System
- Erstellen Sie eine Datenbank: `schaltwerk_pro`
- Benutzer: `postgres` (oder eigenen Benutzer erstellen)

**Option B: Nur PostgreSQL in Docker (empfohlen)**
```bash
docker run -d \
  --name schaltwerk-postgres-local \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=schaltwerk_pro \
  -p 5432:5432 \
  postgres:16-alpine
```

### 2. Backend Setup

```bash
cd schaltwerk-backend

# Dependencies installieren
npm install

# .env Datei erstellen (siehe .env.example)
cp .env.example .env

# Datenbank-Migrationen ausführen
npm run migrate

# Optional: Seed-Daten laden
npm run seed

# Development Server starten
npm run dev
```

Backend läuft auf: `http://localhost:3001`

### 3. Frontend Setup

```bash
cd schaltwerk-pro

# Dependencies installieren
npm install

# .env.local Datei erstellen (siehe .env.example)
cp .env.example .env.local

# Development Server starten
npm run dev
```

Frontend läuft auf: `http://localhost:3000`

## Umgebungsvariablen

### Backend (.env)

Erstellen Sie `schaltwerk-backend/.env`:

```env
NODE_ENV=development
PORT=3001

# Datenbank
DB_HOST=localhost
DB_PORT=5432
DB_NAME=schaltwerk_pro
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=change-this-secret-in-development
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env.local)

Erstellen Sie `schaltwerk-pro/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Entwicklung

### Backend starten
```bash
cd schaltwerk-backend
npm run dev
```

### Frontend starten
```bash
cd schaltwerk-pro
npm run dev
```

Beide Server unterstützen Hot Reload - Änderungen werden automatisch übernommen.

## Nützliche Befehle

### Datenbank-Migrationen
```bash
cd schaltwerk-backend
npm run migrate
```

### Seed-Daten laden
```bash
cd schaltwerk-backend
npm run seed
```

### Backend bauen
```bash
cd schaltwerk-backend
npm run build
```

### Frontend bauen
```bash
cd schaltwerk-pro
npm run build
```

## Troubleshooting

### Port bereits belegt
- Backend (3001): Ändern Sie `PORT` in der `.env` Datei
- Frontend (3000): Ändern Sie den Port in `package.json` oder verwenden Sie `-p 3001`

### Datenbank-Verbindungsfehler
- Prüfen Sie, ob PostgreSQL läuft
- Prüfen Sie die Verbindungsdaten in der `.env` Datei
- Bei Docker: Prüfen Sie ob der Container läuft: `docker ps`

### CORS-Fehler
- Stellen Sie sicher, dass `CORS_ORIGIN` in der Backend `.env` auf die Frontend-URL zeigt
- Standard: `http://localhost:3000`

## Produktion

Für die Produktion können Sie weiterhin Docker verwenden:
- `docker-compose.yml` für Production-Build
- `docker-compose.dev.yml` für Development mit Docker

