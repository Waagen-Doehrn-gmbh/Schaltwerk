# Server Deployment Anleitung

Diese Anleitung erklärt, wie Sie das Schalti Pro Projekt auf Ihren Linux Mint Server (IP: 192.168.0.199) mit Docker deployen.

## Voraussetzungen

- Linux Mint Server mit Docker und Docker Compose installiert
- Ports 7000 (Frontend), 7001 (Backend) und 7002 (PostgreSQL) sollten frei sein
- Server-IP: 192.168.0.199

## Schritt 1: Projekt auf den Server kopieren

Kopieren Sie folgende Dateien und Verzeichnisse auf Ihren Server:

### Erforderliche Dateien und Verzeichnisse:

```
Schaltwerk/
├── docker-compose.yml              # ✅ WICHTIG: Production Docker Setup
├── .env                            # ✅ WICHTIG: Umgebungsvariablen (erstellen Sie diese)
├── .env.example                    # Vorlage für .env
├── schalti-backend/                # ✅ Komplettes Backend-Verzeichnis
│   ├── Dockerfile
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   └── src/                        # ✅ Kompletter src-Ordner
├── schalti-pro/                    # ✅ Komplettes Frontend-Verzeichnis
│   ├── Dockerfile
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── postcss.config.mjs
│   ├── tailwind.config.ts
│   ├── components.json
│   └── src/                        # ✅ Kompletter src-Ordner
└── n8n-workflows/                  # Optional: Falls Sie n8n verwenden
    ├── schalti-protokolle-to-teams.json
    └── schalti-chat-to-teams.json
```

### Was NICHT kopiert werden muss:

- `node_modules/` - Wird von Docker neu installiert
- `.next/` - Wird beim Build erstellt
- `dist/` - Wird beim Build erstellt
- `docker-compose.dev.yml` - Nur für Development
- `docker-start.ps1` / `docker-start.sh` - Nur für lokale Entwicklung
- `LOCAL_DEVELOPMENT.md` - Nur für lokale Entwicklung

## Schritt 2: .env Datei erstellen

1. Kopieren Sie `.env.example` zu `.env`:
   ```bash
   cp .env.example .env
   ```

2. Bearbeiten Sie `.env` und setzen Sie:
   - Ein sicheres Passwort für `DB_PASSWORD`
   - Einen sicheren `JWT_SECRET` (z.B. generiert mit `openssl rand -base64 32`)
   - Die Server-IP ist bereits auf `192.168.0.199` gesetzt

## Schritt 3: Docker Container starten

1. Navigieren Sie zum Projektverzeichnis:
   ```bash
   cd /pfad/zum/Schaltwerk
   ```

2. Starten Sie die Container:
   ```bash
   docker-compose up -d --build
   ```

3. Prüfen Sie, ob alle Container laufen:
   ```bash
   docker-compose ps
   ```

4. Prüfen Sie die Logs:
   ```bash
   docker-compose logs -f
   ```

## Schritt 4: Zugriff testen

Nach erfolgreichem Start sollten folgende URLs erreichbar sein:

- **Frontend**: http://192.168.0.199:7000
- **Backend API**: http://192.168.0.199:7001
- **PostgreSQL**: 192.168.0.199:7002 (nur intern im Docker-Netzwerk)

## Schritt 5: Datenbank-Migrationen

Die Datenbank-Migrationen werden automatisch beim Start des Backend-Containers ausgeführt.

Falls Sie die Migrationen manuell ausführen möchten:
```bash
docker exec -it schalti-backend npm run migrate
```

## Schritt 6: Standard-Benutzer

Nach dem ersten Start können Sie sich mit folgenden Test-Benutzern anmelden:

| E-Mail | Passwort | Rolle |
|--------|----------|-------|
| stefan.haering@schalti.de | password123 | Admin |
| michael.weber@schalti.de | password123 | Technische Abnahme |
| thomas.mueller@schalti.de | password123 | Endabnahme |
| anna.schmidt@schalti.de | password123 | Monteur |

**⚠️ WICHTIG**: Ändern Sie die Passwörter in der Produktion!

## Nützliche Befehle

### Container stoppen
```bash
docker-compose down
```

### Container stoppen und Volumes löschen (⚠️ Löscht Datenbank!)
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

## Firewall-Konfiguration

Stellen Sie sicher, dass die folgenden Ports in Ihrer Firewall geöffnet sind:

```bash
# UFW (Ubuntu/Debian/Mint)
sudo ufw allow 7000/tcp  # Frontend
sudo ufw allow 7001/tcp  # Backend API
```

## Backup der Datenbank

### Backup erstellen
```bash
docker exec schalti-postgres pg_dump -U postgres schalti_pro > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Backup wiederherstellen
```bash
cat backup_YYYYMMDD_HHMMSS.sql | docker exec -i schalti-postgres psql -U postgres schalti_pro
```

## Troubleshooting

### Port bereits belegt
Wenn ein Port bereits belegt ist, können Sie die Ports in der `docker-compose.yml` oder `.env` Datei ändern.

### Datenbank-Verbindungsfehler
1. Prüfen Sie, ob der PostgreSQL Container läuft: `docker-compose ps`
2. Prüfen Sie die Umgebungsvariablen in `.env`
3. Prüfen Sie die Backend-Logs: `docker-compose logs backend`

### Frontend kann Backend nicht erreichen
1. Prüfen Sie, ob `NEXT_PUBLIC_API_URL` in `.env` auf `http://192.168.0.199:7001` gesetzt ist
2. Prüfen Sie die Frontend-Logs: `docker-compose logs frontend`
3. Prüfen Sie, ob der Backend-Container läuft: `docker-compose ps`

### Container startet nicht
1. Prüfen Sie die Logs: `docker-compose logs`
2. Prüfen Sie, ob Docker genug Ressourcen hat: `docker system df`
3. Prüfen Sie die Docker-Version: `docker --version` (sollte >= 20.10 sein)

## n8n Integration (Optional)

Falls Sie n8n Workflows verwenden:

1. Importieren Sie die Workflows aus `n8n-workflows/` in Ihre n8n-Instanz
2. Die Workflows sind bereits für die Server-IP `192.168.0.199` konfiguriert
3. Setzen Sie die n8n Webhook-URL in der `.env` Datei:
   ```env
   N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook
   ```

## Produktions-Empfehlungen

Für eine produktive Umgebung sollten Sie:

1. ✅ Starke Passwörter für die Datenbank verwenden
2. ✅ Einen sicheren JWT_SECRET generieren (z.B. `openssl rand -base64 32`)
3. ✅ HTTPS konfigurieren (z.B. mit einem Reverse Proxy wie Nginx)
4. ✅ Regelmäßige Backups der PostgreSQL-Datenbank einrichten
5. ✅ Firewall-Regeln konfigurieren
6. ✅ Log-Rotation einrichten
7. ✅ Monitoring einrichten (z.B. mit Docker Healthchecks)

## Support

Bei Problemen:
1. Prüfen Sie die Container-Logs: `docker-compose logs`
2. Prüfen Sie die Container-Status: `docker-compose ps`
3. Prüfen Sie die Netzwerk-Verbindung: `docker network ls`

