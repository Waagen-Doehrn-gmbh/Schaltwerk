# Checkliste: Dateien für Server-Umzug

## ✅ Diese Dateien/Verzeichnisse MÜSSEN auf den Server:

### Hauptverzeichnis
- [x] `docker-compose.yml` - **WICHTIG**: Production Docker Setup
- [x] `env.example` - Vorlage für .env (kopiere zu .env)
- [x] `SERVER_DEPLOYMENT.md` - Diese Anleitung

### Backend (schalti-backend/)
- [x] `schalti-backend/Dockerfile`
- [x] `schalti-backend/package.json`
- [x] `schalti-backend/package-lock.json`
- [x] `schalti-backend/tsconfig.json`
- [x] `schalti-backend/src/` - **Komplettes Verzeichnis** (alle Dateien)

### Frontend (schalti-pro/)
- [x] `schalti-pro/Dockerfile`
- [x] `schalti-pro/package.json`
- [x] `schalti-pro/package-lock.json`
- [x] `schalti-pro/tsconfig.json`
- [x] `schalti-pro/next.config.ts`
- [x] `schalti-pro/postcss.config.mjs`
- [x] `schalti-pro/tailwind.config.ts` (falls vorhanden)
- [x] `schalti-pro/components.json`
- [x] `schalti-pro/src/` - **Komplettes Verzeichnis** (alle Dateien)
- [x] `schalti-pro/public/` - **Komplettes Verzeichnis** (falls vorhanden)

### Optional: n8n Workflows
- [ ] `n8n-workflows/schalti-protokolle-to-teams.json` - Falls n8n verwendet wird
- [ ] `n8n-workflows/schalti-chat-to-teams.json` - Falls n8n verwendet wird

## ❌ Diese Dateien/Verzeichnisse NICHT kopieren:

- `node_modules/` - Wird von Docker neu installiert
- `.next/` - Wird beim Build erstellt
- `dist/` - Wird beim Build erstellt
- `docker-compose.dev.yml` - Nur für Development
- `docker-start.ps1` / `docker-start.sh` - Nur für lokale Entwicklung
- `LOCAL_DEVELOPMENT.md` - Nur für lokale Entwicklung
- `.env` - Erstelle diese auf dem Server (kopiere von env.example)
- `.git/` - Git-Verzeichnis (optional)

## 📋 Schnell-Checkliste für Server-Setup:

1. [ ] Projekt-Verzeichnisse auf Server kopiert
2. [ ] `env.example` zu `.env` kopiert: `cp env.example .env`
3. [ ] `.env` bearbeitet und Passwörter gesetzt
4. [ ] Docker und Docker Compose installiert
5. [ ] Ports 7000, 7001, 7002 in Firewall freigegeben
6. [ ] `docker-compose up -d --build` ausgeführt
7. [ ] Container-Status geprüft: `docker-compose ps`
8. [ ] Frontend getestet: http://192.168.0.199:7000
9. [ ] Backend getestet: http://192.168.0.199:7001

## 🚀 Transfer-Methoden

### Option 1: SCP (Secure Copy)
```bash
# Vom lokalen Rechner zum Server
scp -r schalti-backend/ schalti-pro/ docker-compose.yml env.example SERVER_DEPLOYMENT.md user@192.168.0.199:/pfad/zum/projekt/
```

### Option 2: Git (Empfohlen)
```bash
# Auf dem Server
git clone <repository-url>
cd Schaltwerk
cp env.example .env
# .env bearbeiten
docker-compose up -d --build
```

### Option 3: rsync
```bash
# Vom lokalen Rechner zum Server
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude 'dist' \
  schalti-backend/ schalti-pro/ docker-compose.yml env.example \
  user@192.168.0.199:/pfad/zum/projekt/
```

## 📝 Wichtige Hinweise

- Die Server-IP `192.168.0.199` ist bereits in allen Konfigurationsdateien gesetzt
- Erstellen Sie die `.env` Datei auf dem Server (nicht lokal kopieren!)
- Setzen Sie sichere Passwörter in der `.env` Datei
- Die Datenbank-Migrationen laufen automatisch beim ersten Start

