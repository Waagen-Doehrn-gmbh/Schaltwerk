# Docker Setup für Schalti

Diese Anleitung erklärt, wie Sie das Schalti-Projekt mit Docker starten.

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
   DB_NAME=schalti_pro
   DB_USER=postgres
   DB_PASSWORD=postgres

   # JWT Konfiguration
   JWT_SECRET=change-this-secret-in-production
   JWT_EXPIRES_IN=7d

   # Server Konfiguration
   PORT=3001
   NODE_ENV=production

   # CORS Konfiguration
   # Für Server-Deployment: Verwende die Server-IP (z.B. http://192.168.0.199:7000)
   CORS_ORIGIN=http://192.168.0.199:7000

   # Frontend API URL
   # Für Server-Deployment: Verwende die Server-IP (z.B. http://192.168.0.199:7001)
   NEXT_PUBLIC_API_URL=http://192.168.0.199:7001
   ```

2. **Docker Container starten**

   ```bash
   docker-compose up -d
   ```

3. **Services aufrufen**

   - Frontend: http://192.168.0.199:7000 (oder http://localhost:7000 wenn lokal)
   - Backend API: http://192.168.0.199:7001 (oder http://localhost:7001 wenn lokal)
   - PostgreSQL: 192.168.0.199:7002 (nur intern im Docker-Netzwerk)
   
   **Hinweis**: Für Server-Deployment siehe [SERVER_DEPLOYMENT.md](./SERVER_DEPLOYMENT.md)

## Verfügbare Befehle

### Container starten
```bash
docker-compose up -d
```

### Container stoppen
```bash
docker-compose down
```

### Container stoppen und Volumes löschen
```bash
docker-compose down -v
```

### Logs anzeigen
```bash
# Alle Services
docker-compose logs -f

# Nur Backend
docker-compose logs -f backend

# Nur Frontend
docker-compose logs -f frontend
```

### Container neu bauen
```bash
docker-compose build --no-cache
docker-compose up -d
```

### In Container einsteigen
```bash
# Backend Container
docker exec -it schalti-backend sh

# Frontend Container
docker exec -it schalti-frontend sh

# PostgreSQL Container
docker exec -it schalti-postgres psql -U postgres -d schalti_pro
```

## Datenbank-Migrationen

Die Datenbank-Migrationen werden automatisch beim Start des Backend-Containers ausgeführt.

Falls Sie die Migrationen manuell ausführen möchten:

```bash
docker exec -it schalti-backend npm run migrate
```

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

