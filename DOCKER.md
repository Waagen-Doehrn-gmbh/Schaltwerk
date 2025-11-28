# Docker Setup für SchaltWerk

Diese Anleitung erklärt, wie Sie das SchaltWerk-Projekt mit Docker starten.

## Voraussetzungen

- Docker und Docker Compose müssen installiert sein
- Ports 7000 (Frontend), 7001 (Backend) und 7002 (PostgreSQL) sollten frei sein

## Schnellstart

1. **Umgebungsvariablen konfigurieren**

   Erstellen Sie eine `.env` Datei im Hauptverzeichnis mit folgenden Variablen:

   ```env
   # Datenbank Konfiguration
   DB_HOST=postgres
   DB_PORT=7002
   DB_NAME=schaltwerk_pro
   DB_USER=postgres
   DB_PASSWORD=postgres

   # JWT Konfiguration
   JWT_SECRET=change-this-secret-in-production
   JWT_EXPIRES_IN=7d

   # Server Konfiguration
   PORT=3001
   NODE_ENV=production

   # CORS Konfiguration
   CORS_ORIGIN=http://localhost:7000

   # Frontend API URL
   NEXT_PUBLIC_API_URL=http://localhost:7001
   ```

2. **Docker Container starten**

   ```bash
   docker-compose up -d
   ```

3. **Services aufrufen**

   - Frontend: http://localhost:7000
   - Backend API: http://localhost:7001
   - PostgreSQL: localhost:7002

## Verfügbare Befehle

### Mit Makefile (empfohlen)

Das Projekt enthält ein `Makefile` mit vordefinierten Befehlen:

```bash
# Hilfe anzeigen
make help

# Production
make build      # Baue alle Docker-Images
make up         # Starte alle Container (Production)
make logs       # Zeige Logs aller Container
make down       # Stoppe alle Container

# Development
make dev        # Starte alle Container (Development)
make dev-logs   # Zeige Development-Logs

# Weitere Befehle
make rebuild    # Baue Images neu und starte Container
make clean      # Stoppe Container und entferne Volumes
make shell-backend   # Öffne Shell im Backend-Container
make shell-frontend  # Öffne Shell im Frontend-Container
make shell-db        # Öffne PostgreSQL-Shell
make migrate     # Führe Datenbank-Migrationen aus
make seed        # Fülle Datenbank mit Seed-Daten
```

### Mit Docker Compose direkt

#### Container starten
```bash
# Production
docker-compose up -d

# Development (mit Hot Reload)
docker-compose -f docker-compose.dev.yml up -d
```

#### Container stoppen
```bash
docker-compose down
```

#### Container stoppen und Volumes löschen
```bash
docker-compose down -v
```

#### Logs anzeigen
```bash
# Alle Services
docker-compose logs -f

# Nur Backend
docker-compose logs -f backend

# Nur Frontend
docker-compose logs -f frontend
```

#### Container neu bauen
```bash
docker-compose build --no-cache
docker-compose up -d
```

#### In Container einsteigen
```bash
# Backend Container
docker exec -it schaltwerk-backend sh

# Frontend Container
docker exec -it schaltwerk-frontend sh

# PostgreSQL Container
docker exec -it schaltwerk-postgres psql -U postgres -d schaltwerk_pro
```

## Datenbank-Migrationen

Die Datenbank-Migrationen werden automatisch beim Start des Backend-Containers ausgeführt. Das Backend wartet automatisch, bis PostgreSQL bereit ist, bevor die Migrationen ausgeführt werden.

Falls Sie die Migrationen manuell ausführen möchten:

```bash
# Mit Makefile
make migrate

# Oder direkt
docker exec -it schaltwerk-backend npm run migrate
```

## Development vs. Production

### Production (`docker-compose.yml`)
- Optimierte Multi-Stage Builds
- Keine Source-Code-Mounts
- Standalone Next.js Build
- Automatische Migrationen beim Start

### Development (`docker-compose.dev.yml`)
- Hot Reload für Backend (tsx watch)
- Hot Reload für Frontend (Next.js dev)
- Source-Code-Mounts für Live-Editing
- Upload-Verzeichnis wird lokal gemountet
- Polling für Windows File System aktiviert

## Troubleshooting

### Port bereits belegt
Wenn ein Port bereits belegt ist, können Sie die Ports in der `docker-compose.yml` oder `.env` Datei ändern.

### Datenbank-Verbindungsfehler
Stellen Sie sicher, dass:
- Der PostgreSQL Container läuft: `docker-compose ps`
- Die Umgebungsvariablen korrekt gesetzt sind
- Der Backend-Container auf den Service-Namen `postgres` (nicht `localhost`) zugreift

### Frontend kann Backend nicht erreichen
Stellen Sie sicher, dass `NEXT_PUBLIC_API_URL` in der `.env` Datei auf `http://localhost:7001` gesetzt ist (oder die entsprechende Backend-URL).

## Produktions-Deployment

Für Produktionsumgebungen sollten Sie:

1. Starke Passwörter für die Datenbank verwenden
2. Einen sicheren JWT_SECRET generieren
3. HTTPS konfigurieren (z.B. mit einem Reverse Proxy wie Nginx)
4. Die CORS_ORIGIN auf die tatsächliche Domain setzen
5. Regelmäßige Backups der PostgreSQL-Datenbank einrichten

