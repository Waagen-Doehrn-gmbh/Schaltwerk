# Migration vom alten Schalti-System

Dieses Skript migriert **Projekte (Schaltschränke)** und **Protokolle** vom alten Django-System (SQLite) ins neue Node.js/PostgreSQL-System.

## Voraussetzungen

1. **SQLite-Datenbank**: Die alte SQLite-Datenbank (`db.sqlite3`) muss im `alte_datenbank/` Verzeichnis vorhanden sein
2. **Zugriff auf die neue Datenbank**: Die neue PostgreSQL-Datenbank muss bereits eingerichtet sein
3. **Benutzer müssen bereits migriert sein**: Das Skript erstellt ein Mapping zwischen alten und neuen Benutzern
4. **Dependencies**: `better-sqlite3` muss installiert sein (`npm install`)

## Konfiguration

Erstelle oder erweitere die `.env`-Datei im `schalti-backend` Verzeichnis:

```env
# Neue Datenbank (bereits konfiguriert)
DATABASE_URL=postgresql://user:password@localhost:5432/schalti_pro
# oder
DB_HOST=localhost
DB_PORT=5432
DB_NAME=schalti_pro
DB_USER=postgres
DB_PASSWORD=password

# Alte SQLite-Datenbank (optional, Standard: ../alte_datenbank/db.sqlite3)
OLD_DB_PATH=../alte_datenbank/db.sqlite3
```

## Tabellennamen im alten System

Das Skript verwendet folgende Django-Standard-Tabellennamen:
- `dokumentation_schaltschrank` für Schaltschränke/Projekte
- `dokumentation_worklog` für Arbeitsprotokolle
- `auth_user` für Benutzer
- `dokumentation_predefinedtask` für vordefinierte Aufgaben

Diese Tabellennamen sind fest im Skript definiert und werden automatisch verwendet.

## Status-Mapping

Das Skript mappt automatisch die Status-Werte:

| Alt | Neu |
|-----|-----|
| PLANNED, GEPLANT, PLANUNG | planung |
| IN_PROGRESS, AKTIV, IN BEARBEITUNG, IN_BEARBEITUNG | in_bearbeitung |
| COMPLETED, FERTIG, FERTIGGESTELLT, ABGESCHLOSSEN | abgeschlossen |

## Benutzer-Mapping

Das Skript versucht, Benutzer automatisch zu matchen:
1. **Zuerst per E-Mail**: Wenn die E-Mail-Adresse übereinstimmt
2. **Dann per Name**: Wenn Vor- und Nachname übereinstimmen

Falls kein Match gefunden wird, werden Protokolle einem Admin-Benutzer zugeordnet.

## Aufgaben-Mapping

Das Skript migriert automatisch vordefinierte Aufgaben:
- **Matching**: Aufgaben werden per Name mit der neuen Datenbank gematcht
- **Auto-Erstellung**: Falls eine Aufgabe nicht existiert, wird sie automatisch in der neuen Datenbank erstellt
- **Protokoll-Zuordnung**: Protokolle erhalten den Namen der zugeordneten Aufgabe

## Ausführung

```bash
cd schalti-backend
npm run migrate-old
```

## Was wird migriert?

### Projekte (Schaltschränke)
- Name
- Schaltschranknummer
- Standort
- Status (gemappt)
- Erstellungs- und Aktualisierungsdatum

**Hinweis**: Projekte mit derselben Schaltschranknummer werden übersprungen (keine Duplikate).

### Protokolle (Arbeitsprotokolle)
- Aufgabe
- Details/Abweichungen
- Zeitaufwand
- Datum
- Benutzer (gemappt)
- Projekt (gemappt)
- Erstellungs- und Aktualisierungsdatum

## Fehlerbehandlung

- **Duplikate**: Projekte mit derselben Schaltschranknummer werden übersprungen
- **Fehlende Benutzer**: Protokolle ohne zugeordneten Benutzer werden einem Admin zugeordnet
- **Fehlende Projekte**: Protokolle ohne zugeordnetes Projekt werden übersprungen
- **Fehlende Tabellen**: Das Skript zeigt eine Fehlermeldung mit Hinweis auf die richtigen Tabellennamen

## Logging

Das Skript gibt detaillierte Informationen aus:
- ✓ Erfolgreich migrierte Einträge
- ⚠ Warnungen (z.B. fehlende Benutzer)
- ❌ Fehler (mit Details)

## Beispiel-Ausgabe

```
🔄 Starte Migration von altem System (SQLite)...

📡 Öffne SQLite-Datenbank: ../alte_datenbank/db.sqlite3
✓ SQLite-Datenbank erfolgreich geöffnet

📡 Teste Verbindung zur neuen Datenbank...
✓ Verbindung zur neuen Datenbank erfolgreich

👥 Erstelle User-Mapping...
  ✓ stefan (stefan@example.com) -> abc123...
✓ 5 Benutzer gemappt

📋 Erstelle Aufgaben-Mapping...
  ✓ "Dokumentation erstellt" -> def456...
  ✓ Neue Aufgabe erstellt: "Neue Aufgabe" -> ghi789...
✓ 12 Aufgaben gemappt

📁 Migriere Projekte...
  📊 Gefunden: 12 Schaltschränke
  ✓ "Bolz Auffahrt" (25-003-02) -> jkl012...
  ✓ "Bolz Einfahrt" (25-003-01) -> mno345...
✓ 12 Projekte migriert

📝 Migriere Protokolle...
  📊 Gefunden: 145 Protokolle
  ✓ 145 Protokolle migriert

✅ Migration erfolgreich abgeschlossen!
```

## Troubleshooting

### "SQLite-Datenbank nicht gefunden"
- Stelle sicher, dass `alte_datenbank/db.sqlite3` existiert
- Oder setze `OLD_DB_PATH` in `.env` auf den korrekten Pfad

### "Tabelle nicht gefunden"
- Prüfe die Tabellennamen in der SQLite-Datenbank
- Die Tabellennamen sind fest im Skript definiert (Django-Standard)

### "Kein Match gefunden für Benutzer"
- Stelle sicher, dass Benutzer bereits im neuen System existieren
- Prüfe, ob E-Mail-Adressen oder Namen übereinstimmen

### "Projekt bereits vorhanden"
- Das ist normal - Projekte mit derselben Schaltschranknummer werden übersprungen
- Duplikate werden verhindert

## Wichtig

- **Backup erstellen**: Erstelle vor der Migration ein Backup der neuen Datenbank
- **Testlauf**: Teste die Migration zuerst mit einer kleinen Datenmenge
- **Prüfen**: Prüfe nach der Migration die migrierten Daten

