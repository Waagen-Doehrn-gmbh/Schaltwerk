Ich baue "SchaltWerk" - eine Dokumentations-Software für Schaltschrankbau-Fertigung.
Zielgruppe: Interne Nutzung für 2-15 Mitarbeiter (Desktop & Tablet)
Hauptfunktionen:

Projekte verwalten (Schaltschrank-Aufträge)
Arbeitsprotokolle erstellen (Montage-Dokumentation)
Komponenten tracken (verbaute Teile)
Zeiterfassung pro Aufgabe
Aktivitäts-Timeline

Tech Stack:

Next.js 14 (App Router)
TypeScript
Tailwind CSS
shadcn/ui
Lucide React Icons
date-fns

Design: Modern, minimalistisch, professionell, Desktop-optimiert mit Sidebar
WICHTIG: Heute NUR Frontend mit Mock Data - KEIN Backend, KEINE Datenbank, KEINE API Routes!

AUFGABE: COMPLETE FRONTEND BUILD
Erstelle die komplette Frontend-Anwendung mit folgender Struktur:

1. PROJEKT SETUP
bash# Diese Commands habe ich bereits ausgeführt:
npx create-next-app@latest schaltwerk-pro --typescript --tailwind --app
npm install lucide-react date-fns
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input label select textarea badge avatar

2. MOCK DATA (lib/mock-data.ts)
Erstelle umfangreiche Mock-Daten mit:
Users:

Stefan Häring (Admin, SH)
Jamie Szymiczek (Mitarbeiter, JS)
2-3 weitere Mitarbeiter

Projekte (mindestens 5):

"Bolz Einfahrt" (Dorsten, Standard, in_bearbeitung)
"Meyer Schaltanlage" (Essen, Premium, abgeschlossen)
"Schmidt Steuerung" (Bochum, Standard, planung)
2 weitere realistische Namen

Jedes Projekt mit:

id, name, standort, projektTyp, status, createdAt
stats: { stunden, eintraege, komponenten, gesamtKomponenten }

Arbeitsprotokolle (15-20 Einträge):
Verschiedene Aufgaben wie:

"Komponenten eingebaut"
"Grundplatte Bestückt und Verdrahtet"
"Funktionstest durchgeführt"
"Erdungen hergestellt"
etc.

Mit: aufgabe, details (optional), zeitaufwand (0.5-3.0), datum, userId, projektId
Komponenten (20-30 Stück):
Realistische Schaltschrank-Teile:

Heizungen, PCs, Lüfter, Schalter, Relais, etc.
Mit: name, artikelNummer, status (abgeschlossen/ausstehend), projektId

AUFGABEN_LISTE Array:
Alle möglichen Aufgaben für Dropdown
Helper Functions:

getProjektById(id)
getProtokollByProjekt(projektId)
getKomponentenByProjekt(projektId)
getAllProtokoll() mit User joined
getRecentActivity(limit)


3. TYPES (types/index.ts)
Vollständige TypeScript Interfaces für:

User
Projekt (mit stats)
Arbeitsprotokoll (mit optional user)
Komponente
FormData Types


4. UTILS (lib/utils.ts)
Helper Functions:

formatDate(date) → "07.10.2025 • 14:57"
formatStunden(hours) → "1,5 Std"
getStatusColor(status) → Tailwind classes
getStatusBadge(status) → Badge component props
cn() für Tailwind merge (from shadcn)


5. LAYOUT STRUKTUR
app/layout.tsx

Root Layout mit Metadata
Font Setup (Inter)
globals.css import

app/globals.css

Tailwind directives
Custom scrollbar (modern, dünn, smooth)
CSS Variables für Farben
Animations für transitions
Focus states

app/(dashboard)/layout.tsx
Haupt-Layout mit:
Sidebar (260px, fixed left):

Dark Theme (bg-slate-900)
Logo + "SchaltWerk" Text mit Zap Icon
Navigation Items:

Dashboard (Home Icon)
Projekte (Folder Icon)
Protokolle (FileText Icon)
Komponenten (Box Icon)
Einstellungen (Settings Icon)


Active State: bg-slate-800 + border-left blue
Hover Effects
Footer mit Projekt-Info

Top Bar (full width):

Breadcrumb Navigation (links)
User Info: Avatar + Name (rechts)
White background, border-bottom

Main Content:

Flex-1, overflow-y-auto
Padding: 2rem
Max-width: 1400px centered
Light gray background (bg-slate-50)


6. PAGES
app/(dashboard)/page.tsx - DASHBOARD HOME
Server Component
Zeigt:

Welcome Header

"Willkommen zurück, [User Name]"
Aktuelles Datum


Quick Stats Row (4 Cards)

Gesamt Stunden (alle Projekte)
Aktive Projekte
Einträge diese Woche
Offene Komponenten


Projekte Grid (responsive, 2-3 columns)
Jede Projekt-Karte zeigt:

Projekt Name (groß)
Standort + Typ
Status Badge (farbcodiert)
Mini-Stats (Stunden, Einträge)
Progress Bar (Komponenten)
Hover Effect + Shadow
Click → Link zu /projekte/[id]


Recent Activity Section (rechte Sidebar oder unten)

Letzte 5-10 Protokoll-Einträge
User + Aufgabe + Zeit



Modern, clean Design mit spacing

app/(dashboard)/projekte/page.tsx - PROJEKT ÜBERSICHT
Server Component
Zeigt:

Header

"Alle Projekte" Title
Filter Buttons: Alle, Aktiv, Abgeschlossen, Planung
Search Bar (Client Component)


Projekte Grid (wie Dashboard, aber alle)

Sortierung: Status, dann Datum
Mehr Details als auf Dashboard




app/(dashboard)/projekte/[id]/page.tsx - PROJEKT DETAILS
Server Component mit Dynamic Route
Layout:

Project Header (full width, gradient bg)

Projekt Name (groß)
Standort • Projekt Typ
Status Badge (groß)
Edit Button (später)


Stats Grid (4 Cards, full width)

Gesamt Stunden
Einträge
Komponenten abgeschlossen / gesamt
Tage aktiv


Two-Column Layout (responsive)
Linke Spalte (2/3 width):

Arbeitsprotokoll Form (Component)
Komponenten Liste (Component)

Rechte Spalte (1/3 width):

Activity Timeline (Component)



404 Handling wenn Projekt nicht existiert

app/(dashboard)/protokolle/page.tsx - ALLE PROTOKOLLE
Server Component
Zeigt:

Header

"Arbeitsprotokolle" Title
Filter: Nach Projekt, Nach User, Datum-Range
Export Button (später)


Protokoll Table/Cards

Datum | User | Projekt | Aufgabe | Stunden
Sortierbar
Click → Details Modal (später)
Zebra-Stripes oder Card-Layout




app/(dashboard)/komponenten/page.tsx - ALLE KOMPONENTEN
Server Component
Zeigt:

Header

"Komponenten" Title
Filter: Status, Projekt
Search


Komponenten Grid

Name + Artikel-Nr
Projekt Name
Status Badge
Grouped by Projekt (optional)




7. COMPONENTS
components/dashboard/Sidebar.tsx
Client Component (für active state)

Navigation mit usePathname
Wie oben beschrieben
Smooth transitions
Logo clickable → Dashboard


components/dashboard/TopBar.tsx
Client Component

Breadcrumb mit usePathname
User Avatar + Dropdown (später)
Responsive


components/dashboard/StatsCard.tsx
Props: value (number), label (string), icon (optional), trend (optional)

Card Design
Großer farbiger Value
Small Label
Optional Icon (lucide)
Optional Trend indicator (↑ ↓)
Hover scale effect


components/projekt/ProjectHeader.tsx
Props: projekt (Projekt)

Gradient background (blue)
Projekt Info prominent
Status Badge
Modern, eye-catching


components/projekt/ProjectCard.tsx
Props: projekt (Projekt)

Used in grids
Name, standort, stats
Status badge
Progress bar für Komponenten
Hover effect, clickable
Link to detail page


components/protokoll/ProtokollForm.tsx
Client Component (useState für Form)
Form mit:

Select für Aufgabe (AUFGABEN_LISTE)
Textarea für Details (optional)
Number Input für Zeitaufwand (Std, step 0.5)
Submit Button (primary, full width)

Features:

Form State mit useState
Validation (aufgabe required, zeitaufwand > 0)
onSubmit:

console.log(formData)
Success Toast/Message: "Protokoll erstellt!"
Form reset
Later: Add to mock data array (useState in parent)



Schönes Card Design mit Header "Neues Arbeitsprotokoll"

components/protokoll/ActivityList.tsx
Props: protokolle (Arbeitsprotokoll[])
Timeline Design:

Vertical line (left side)
Each item:

User Avatar/Initials (circle on line)
User Name
Aufgabe (bold)
Details (if exists, gray)
Datum • Zeit • Stunden Badge


Hover effect (background)
Scrollable (max-height)
Empty state wenn keine Daten

Modern Timeline UI

components/komponenten/ComponentsList.tsx
Props: komponenten (Komponente[])
Grid/List von Komponenten:

Card per Komponente
Name (bold)
Artikel-Nr (monospace, small, gray)
Status Badge (abgeschlossen=green, ausstehend=yellow)
Hover effect
Click → Highlight (useState)
Group by Status (Sections)

Clean, organized layout

components/komponenten/KomponenteCard.tsx
Props: komponente (Komponente)

Single card design
Reusable
Status indicator
Hover effects


8. DESIGN SPECIFICATIONS
Farb-Palette:

Primary: Blue (#3b82f6 / #2563eb)
Background: Slate (#f8fafc, #f1f5f9)
Sidebar: Dark Slate (#1e293b, #334155)
Success: Green (#10b981)
Warning: Yellow (#f59e0b)
Danger: Red (#ef4444)

Typography:

Font: Inter (System Font Stack)
Headings: font-semibold / font-bold
Body: font-normal
Small: text-sm / text-xs

Spacing:

Consistent: 0.5rem, 1rem, 1.5rem, 2rem
Cards: padding 1.5-2rem
Grid gaps: 1.5-2rem

Borders & Radius:

Cards: rounded-lg (8px) or rounded-xl (12px)
Buttons: rounded-lg
Badges: rounded-md / rounded-full
Border color: slate-200 / slate-300

Shadows:

Cards: shadow-sm
Hover: shadow-md
Modal (later): shadow-xl

Transitions:

All: transition-all duration-200
Hover scale: scale-105
Smooth


9. INTERAKTIVITÄT (nur Frontend)
Was funktioniert:

✅ Navigation zwischen Pages
✅ Protokoll Form Submit (console.log + reset)
✅ Projekt Cards clickable → Details
✅ Active Navigation States
✅ Hover Effects überall
✅ Scrollbare Bereiche

Was NICHT funktioniert (ist OK):

❌ Echte Datenpersistenz (Mock Data bleibt gleich)
❌ Edit/Delete (Buttons können da sein, aber disabled)
❌ Search/Filter (UI da, aber statisch)
❌ User Dropdown (nur Avatar anzeigen)


10. RESPONSIVE DESIGN
Priorität: Desktop & Tablet

Desktop: Full Sidebar, Two-Columns
Tablet: Sidebar bleibt, Single Column für Content
Mobile (low priority): Collapsible Sidebar

Breakpoints:

lg: 1024px
md: 768px


11. CODE QUALITÄT
TypeScript:

Strict mode
Alle Props typisiert
No 'any' types
Interfaces für alles

React Best Practices:

Server Components by default
'use client' nur wenn nötig (Forms, useState)
Proper imports
Component composition

Tailwind:

Utility-first
Konsistente Klassen
No inline styles
Responsive classes

File Organization:

One component per file
Clear naming
Exports am Ende


12. ZUSÄTZLICHE FEATURES (Nice-to-have)
Wenn Zeit bleibt:

Loading States

Skeleton Cards während "Laden"
Spinner bei Submit


Empty States

Schöne Placeholders wenn keine Daten
Mit Icon + Text + Action Button


Toasts/Notifications

Success Message nach Form Submit
Mit shadcn/ui toast


Animations

Framer Motion für Page Transitions (optional)
Stagger Animations für Lists




13. TESTING CHECKLIST
Nach dem Build, teste:

 Alle Pages erreichbar
 Navigation funktioniert
 Forms submitten (Console Check)
 Keine TypeScript Errors
 Keine Console Warnings
 Responsive auf verschiedenen Breiten
 Hover States funktionieren
 Mock Data wird korrekt angezeigt


14. DELIVERABLES
Am Ende sollte ich haben:
schaltwerk-pro/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx ✅
│   │   ├── page.tsx ✅
│   │   ├── projekte/
│   │   │   ├── page.tsx ✅
│   │   │   └── [id]/page.tsx ✅
│   │   ├── protokolle/page.tsx ✅
│   │   └── komponenten/page.tsx ✅
│   ├── layout.tsx ✅
│   └── globals.css ✅
├── components/
│   ├── ui/ (shadcn) ✅
│   ├── dashboard/ ✅
│   ├── projekt/ ✅
│   ├── protokoll/ ✅
│   └── komponenten/ ✅
├── lib/
│   ├── mock-data.ts ✅
│   └── utils.ts ✅
├── types/
│   └── index.ts ✅
└── README.md (mit Screenshots)

15. START COMMAND
Beginne mit:

Mock Data erstellen (lib/mock-data.ts)
Types definieren (types/index.ts)
Utils (lib/utils.ts)
Layout (Sidebar + TopBar)
Dashboard Page
Components nach Bedarf
Weitere Pages

Los geht's! Erstelle die komplette Frontend-Anwendung Schritt für Schritt.
Frage mich bei Unklarheiten, aber versuche möglichst viel selbstständig umzusetzen basierend auf den Anforderungen.
Ziel: Voll funktionale, schön aussehende Frontend-Demo mit Mock Data!

WICHTIGE HINWEISE

Nutze moderne ES6+ Syntax
Komponenten sollten wiederverwendbar sein
Code sollte clean und gut kommentiert sein
Fokus auf UX: Smooth, fast, intuitive
Deutsche Labels/Texte wo User es sieht
Englische Code/Variablen Namen

Let's build! 🚀