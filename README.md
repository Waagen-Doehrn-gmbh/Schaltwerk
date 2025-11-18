# Schalti Pro

Dokumentations-Software für Schaltschrankbau - Eine moderne Web-Anwendung zur Verwaltung von Projekten, Protokollen, Komponenten und Checklisten im Schaltschrankbau.

## 📋 Übersicht

Schalti Pro ist eine Full-Stack-Anwendung zur digitalen Dokumentation und Verwaltung von Schaltschrank-Projekten. Die Software ermöglicht es, Projekte zu verwalten, Arbeitsprotokolle zu erstellen, Komponenten zu dokumentieren und Abnahme-Checklisten zu führen.

## 🚀 Features

- **Projektverwaltung**: Erstellen und verwalten Sie Schaltschrank-Projekte mit Status-Tracking
- **Arbeitsprotokolle**: Dokumentieren Sie Arbeitszeiten, Aufgaben und Fortschritte
- **Komponentenverwaltung**: Verwalten Sie Komponenten mit Artikelnummern und Status
- **Checklisten**: Erstellen Sie individuelle Checklisten für Aufgaben und Abnahmen
- **QR-Code Integration**: Generieren Sie QR-Codes für schnellen Projektzugriff
- **Analyse & Berichte**: Visualisieren Sie Projektfortschritt und Zeitaufwand
- **Benutzerverwaltung**: Rollenbasierte Zugriffskontrolle (Admin, Monteur, Technische Abnahme, Endabnahme)
- **Chat-Funktion**: Kommunikation innerhalb von Projekten
- **Dark Mode**: Unterstützung für dunkles Design

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React Framework mit App Router
- **React 19** - UI Library
- **TypeScript** - Type Safety
- **Tailwind CSS 4** - Styling
- **shadcn/ui** - UI Component Library
- **React Hook Form** - Form Management
- **Zod** - Schema Validation
- **TanStack Query (React Query)** - Data Fetching & Caching
- **Recharts** - Datenvisualisierung
- **date-fns** - Datumsformatierung

### Backend
- **Node.js 20** - Runtime
- **Express 4.18** - Web Framework
- **TypeScript** - Type Safety
- **PostgreSQL 16** - Datenbank
- **JWT** - Authentifizierung
- **bcrypt** - Passwort-Hashing
- **Zod** - Schema Validation
- **Multer 2.x** - File Upload (vorbereitet)

### DevOps
- **Docker** - Containerisierung
- **Docker Compose** - Multi-Container Orchestrierung

## 📦 Installation

### Voraussetzungen

- Node.js 20 oder höher
- npm oder yarn
- PostgreSQL 16 (lokal oder via Docker)
- Git

### Lokale Entwicklung (Empfohlen)

Siehe [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) für eine detaillierte Anleitung.

**Kurzfassung:**

1. **PostgreSQL starten** (Docker):
```bash
docker run -d \
  --name schalti-postgres-local \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=schalti_pro \
  -p 5432:5432 \
  postgres:16-alpine
```

2. **Backend Setup**:
```bash
cd schalti-backend
npm install
# .env Datei erstellen (siehe LOCAL_DEVELOPMENT.md)
npm run migrate
npm run dev
```

3. **Frontend Setup**:
```bash
cd schalti-pro
npm install
# .env.local Datei erstellen (siehe LOCAL_DEVELOPMENT.md)
npm run dev
```

4. **Anwendung öffnen**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Docker Development

Siehe [DOCKER.md](./DOCKER.md) für Docker-spezifische Anweisungen.

```bash
# Development mit Hot Reload
docker-compose -f docker-compose.dev.yml up --build

# Production Build
docker-compose up --build
```

## 🔐 Standard-Anmeldedaten

Nach dem ersten Setup können Sie sich mit folgenden Test-Benutzern anmelden:

| E-Mail | Passwort | Rolle |
|--------|----------|-------|
| stefan.haering@schalti.de | password123 | Admin |
| michael.weber@schalti.de | password123 | Technische Abnahme |
| thomas.mueller@schalti.de | password123 | Endabnahme |
| anna.schmidt@schalti.de | password123 | Monteur |

**⚠️ Wichtig**: Ändern Sie die Passwörter in der Produktion!

## 📁 Projektstruktur

```
Schalti/
├── schalti-backend/          # Express Backend API
│   ├── src/
│   │   ├── controllers/      # Request Handler
│   │   ├── models/           # Datenbank-Models
│   │   ├── routes/           # API Routes
│   │   ├── services/         # Business Logic
│   │   ├── middleware/       # Express Middleware
│   │   ├── migrations/      # Datenbank-Migrationen
│   │   └── utils/           # Hilfsfunktionen
│   └── Dockerfile
│
├── schalti-pro/              # Next.js Frontend
│   ├── src/
│   │   ├── app/              # Next.js App Router
│   │   ├── components/       # React Components
│   │   ├── lib/              # Utilities & Hooks
│   │   └── types/            # TypeScript Types
│   └── Dockerfile.dev
│
├── docker-compose.yml        # Production Docker Setup
├── docker-compose.dev.yml    # Development Docker Setup
├── LOCAL_DEVELOPMENT.md      # Lokale Entwicklung
└── README.md                 # Diese Datei
```

## 🎯 Verwendung

### Projekte erstellen

1. Navigieren Sie zu **Verwaltung** → **Projekte**
2. Klicken Sie auf **Neues Projekt**
3. Füllen Sie die Felder aus:
   - Projektname
   - Standort
   - Schaltschranknummer (optional)
   - Komponenten auswählen
4. Speichern Sie das Projekt

### Arbeitsprotokoll erstellen

1. Öffnen Sie ein Projekt
2. Scrollen Sie zum **Arbeitsprotokoll**-Bereich
3. Wählen Sie eine Aufgabe aus
4. Füllen Sie Details und Zeitaufwand aus
5. Bei Aufgaben mit Checkliste: Punkte abhaken
6. Protokoll erstellen

### QR-Code generieren

1. Gehen Sie zu **Verwaltung** → **Projekte**
2. Klicken Sie auf das QR-Code-Icon bei einem Projekt
3. Der QR-Code kann gescannt werden, um direkt zum Projekt zu gelangen

## 🔧 Entwicklung

### Nützliche Befehle

**Backend:**
```bash
cd schalti-backend
npm run dev          # Development Server
npm run build        # Production Build
npm run migrate      # Datenbank-Migrationen
npm run seed         # Seed-Daten laden
```

**Frontend:**
```bash
cd schalti-pro
npm run dev          # Development Server
npm run build        # Production Build
npm run lint         # ESLint
```

### Code-Struktur

- **React Hook Form**: Alle Formulare verwenden React Hook Form mit Zod-Validierung
- **React Query**: Daten-Fetching erfolgt über Custom Hooks in `src/lib/hooks/`
- **TypeScript**: Vollständige Type-Safety im gesamten Projekt
- **Component Library**: shadcn/ui Komponenten in `src/components/ui/`

## 🧪 Testing

Die Anwendung unterstützt:
- TypeScript Type-Checking
- ESLint für Code-Qualität
- React Query DevTools für Debugging

## 📝 API Dokumentation

Die API ist RESTful und verfügbar unter `/api`:

- `/api/auth` - Authentifizierung
- `/api/projekte` - Projekte
- `/api/protokolle` - Arbeitsprotokolle
- `/api/komponenten` - Komponenten
- `/api/checklisten` - Checklisten
- `/api/aufgaben` - Aufgaben
- `/api/chat` - Chat-Nachrichten
- `/api/users` - Benutzerverwaltung

## 🔒 Sicherheit

- **Authentifizierung**: JWT-basiert mit httpOnly Cookies
- **Passwort-Hashing**: bcrypt mit Salt
- **CORS**: Konfiguriert für sichere Cross-Origin Requests
- **Input Validation**: Zod-Schemas für alle Eingaben
- **SQL Injection**: Verhindert durch Parameterized Queries

## 🚢 Deployment

### Production Build

```bash
# Backend
cd schalti-backend
npm run build
npm start

# Frontend
cd schalti-pro
npm run build
npm start
```

### Docker Production

```bash
docker-compose up --build
```

## 📄 Lizenz

Proprietär - Alle Rechte vorbehalten

## 👥 Autoren

Schalti Pro Development Team

## 🙏 Danksagungen

- [Next.js](https://nextjs.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [React Hook Form](https://react-hook-form.com/)
- [TanStack Query](https://tanstack.com/query)

## 📞 Support

Bei Fragen oder Problemen wenden Sie sich bitte an das Entwicklungsteam.

---

**Version**: 0.1.0  
**Letzte Aktualisierung**: November 2025

