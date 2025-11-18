# Schalti Backend API

Backend API für die Schalti Pro Anwendung - Schaltschrankbau-Dokumentation.

## Tech Stack

- Node.js / Express
- TypeScript
- PostgreSQL
- JWT für Authentifizierung
- bcrypt für Passwort-Hashing

## Setup

1. Dependencies installieren:
```bash
npm install
```

2. PostgreSQL Datenbank erstellen:
```bash
createdb schalti_pro
```

3. Environment Variables konfigurieren:
```bash
cp .env.example .env
# .env Datei bearbeiten und Werte anpassen
```

4. Datenbank-Migrationen ausführen:
```bash
npm run migrate
```

5. Seed-Daten einfügen (optional):
```bash
npm run seed
```

6. Server starten:
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## API Endpoints

### Authentifizierung
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registrierung (nur Admin)
- `GET /api/auth/me` - Aktueller User

### Projekte
- `GET /api/projekte` - Alle Projekte
- `GET /api/projekte/:id` - Projekt Details
- `POST /api/projekte` - Neues Projekt erstellen
- `PUT /api/projekte/:id` - Projekt aktualisieren
- `DELETE /api/projekte/:id` - Projekt löschen

### Protokolle
- `GET /api/protokolle` - Alle Protokolle
- `GET /api/protokolle/projekt/:projektId` - Protokolle eines Projekts
- `POST /api/protokolle` - Neues Protokoll erstellen
- `PUT /api/protokolle/:id` - Protokoll aktualisieren
- `DELETE /api/protokolle/:id` - Protokoll löschen

### Komponenten
- `GET /api/komponenten` - Alle Komponenten
- `GET /api/komponenten/projekt/:projektId` - Komponenten eines Projekts
- `POST /api/komponenten` - Neue Komponente erstellen
- `PUT /api/komponenten/:id` - Komponente aktualisieren
- `DELETE /api/komponenten/:id` - Komponente löschen

### Chat
- `GET /api/chat/projekt/:projektId` - Chat-Nachrichten eines Projekts
- `POST /api/chat` - Neue Nachricht senden

### Checklisten
- `GET /api/checklisten` - Alle Checklisten
- `POST /api/checklisten` - Neue Checkliste erstellen
- `PUT /api/checklisten/:id` - Checkliste aktualisieren
- `DELETE /api/checklisten/:id` - Checkliste löschen

### Aufgaben
- `GET /api/aufgaben` - Alle Aufgaben
- `POST /api/aufgaben` - Neue Aufgabe erstellen
- `PUT /api/aufgaben/:id` - Aufgabe aktualisieren
- `DELETE /api/aufgaben/:id` - Aufgabe löschen

### Webhooks (für n8n Integration)
- `POST /api/webhook/protokoll` - Hole Protokoll-Daten für n8n
  - Body: `{ "protokollId": "uuid" }`
- `POST /api/webhook/chat` - Hole Chat-Daten für n8n
  - Body: `{ "messageId": "uuid" }`

## n8n Integration

Das Backend sendet automatisch Webhooks an n8n, wenn:
- Ein neues Protokoll erstellt wird
- Eine neue Chat-Nachricht erstellt wird

**Konfiguration:**
Setze die Environment-Variable `N8N_WEBHOOK_URL` auf die Basis-URL deiner n8n-Instanz:
```env
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook
```

Siehe `n8n-workflows/README.md` für detaillierte Anleitung zur Einrichtung der n8n Workflows.

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/schalti_pro
DB_HOST=localhost
DB_PORT=5432
DB_NAME=schalti_pro
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-secret-key-change-this
JWT_EXPIRES_IN=7d

# Server
PORT=7001
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000

# n8n Integration (optional)
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook
```

## Datenbank-Schema

Siehe `src/migrations/` für SQL-Migrationen.

