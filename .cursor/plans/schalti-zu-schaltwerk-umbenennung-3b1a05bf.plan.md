<!-- 3b1a05bf-a210-4a75-bc3f-83355eb37277 a85a5b02-9be7-44d7-8368-9c3dd5f40a95 -->
# E-Mail-Adressen entfernen - Umstellung auf Benutzernamen

## Übersicht

Das System läuft lokal im Netzwerk und benötigt keine E-Mail-Adressen. Alle Authentifizierung und Benutzerverwaltung soll über Benutzernamen erfolgen.

## Datenbank-Änderungen

### Migration erstellen

- Neue Migration: `013_remove_email_add_username.sql`
- `email` Feld optional machen (NULL erlauben) oder entfernen
- `username` Feld hinzufügen (UNIQUE, NOT NULL) - alternativ `name` als eindeutigen Identifier verwenden
- Index auf `username` erstellen
- Bestehende Daten migrieren: E-Mail-Adressen in Benutzernamen umwandeln oder entfernen

## Backend-Änderungen

### Datenbank-Schema

- `schaltwerk-backend/src/migrations/001_create_users.sql`: `email` optional machen, `username` hinzufügen
- Alle Seed-Daten-Migrationen aktualisieren (008_seed_data.sql, etc.)

### Models

- `schaltwerk-backend/src/models/user.model.ts`:
- `email` aus Interfaces entfernen oder optional machen
- `findByEmail` durch `findByUsername` ersetzen
- `findByName` beibehalten (für Login-Flexibilität)
- `CreateUserInput`: `email` entfernen, `username` hinzufügen

### Services

- `schaltwerk-backend/src/services/auth.service.ts`:
- Login: Nur nach `username` oder `name` suchen (kein E-Mail-Fallback)
- Register: `email` entfernen, `username` verwenden

### Controllers

- `schaltwerk-backend/src/controllers/auth.controller.ts`: Keine Änderungen nötig (verwendet bereits `username`)
- `schaltwerk-backend/src/controllers/user.controller.ts`: E-Mail-Prüfungen entfernen

### Validierung

- `schaltwerk-backend/src/utils/validation.util.ts`:
- `registerSchema`: `email` entfernen, `username` hinzufügen
- `createUserSchema`: `email` entfernen, `username` hinzufügen
- `updateUserSchema`: `email` entfernen

### JWT & Middleware

- `schaltwerk-backend/src/utils/jwt.util.ts`: `email` aus Token-Payload entfernen
- `schaltwerk-backend/src/middleware/auth.middleware.ts`: `email` aus User-Interface entfernen

### Weitere Backend-Dateien

- `schaltwerk-backend/src/models/chat.model.ts`: `email` aus Queries entfernen
- `schaltwerk-backend/src/models/protokoll.model.ts`: `email` aus Queries entfernen
- `schaltwerk-backend/reset-database.js`: E-Mail-Adressen entfernen
- `schaltwerk-backend/update-passwords.js`: E-Mail-Adressen durch Benutzernamen ersetzen
- `schaltwerk-backend/fix-password.js`: E-Mail-Adressen entfernen
- `schaltwerk-backend/src/migrations/run-migrations.ts`: E-Mail-Adressen durch Benutzernamen ersetzen
- `schaltwerk-backend/src/migrations/seed-data.ts`: E-Mail-Adressen entfernen
- `schaltwerk-backend/set-stefan-admin.js`: E-Mail-Prüfung entfernen

## Frontend-Änderungen

### Types

- `schaltwerk-pro/src/types/index.ts`: `email` aus User-Interface entfernen

### API

- `schaltwerk-pro/src/lib/api.ts`:
- `register`: `email` entfernen, `username` hinzufügen

### Komponenten

- `schaltwerk-pro/src/components/verwaltung/BenutzerVerwaltung.tsx`:
- E-Mail-Feld aus Formular entfernen
- `username` Feld hinzufügen
- Schema-Validierung anpassen
- E-Mail-Anzeige in Tabelle entfernen

### Login-Komponente

- Login-Formular prüfen und sicherstellen, dass es `username` verwendet (nicht `email`)

## Dokumentation

### README & Docs

- `README.md`: E-Mail-Adressen aus Standard-Anmeldedaten entfernen
- Alle Dokumentationsdateien aktualisieren

## Seed-Daten

### Migrationen aktualisieren

- `008_seed_data.sql`: E-Mail-Adressen entfernen, Benutzernamen hinzufügen
- Alle anderen Seed-Dateien aktualisieren

## Wichtige Entscheidungen

**Option 1**: `username` als separates Feld hinzufügen

- Vorteil: Klare Trennung zwischen Anzeigename und Login-Name
- Nachteil: Zusätzliches Feld

**Option 2**: `name` als eindeutigen Identifier verwenden

- Vorteil: Einfacher, weniger Änderungen
- Nachteil: Name muss eindeutig sein

**Empfehlung**: Option 1 (separates `username` Feld) für mehr Flexibilität

### To-dos

- [ ] Ordner umbenennen: schalti-backend → schaltwerk-backend, schalti-pro → schaltwerk-pro
- [ ] Dateien in n8n-workflows umbenennen: schalti-*.json → schaltwerk-*.json
- [ ] Root-Level Dateien aktualisieren (package.json, README.md, Docker-Dateien, etc.)
- [ ] Backend-Dateien aktualisieren (package.json, config, migrations, scripts)
- [ ] N8N Workflow-Dateien und README aktualisieren
- [ ] Docker-Konfigurationsdateien aktualisieren (docker-compose.yml, docker-compose.dev.yml)