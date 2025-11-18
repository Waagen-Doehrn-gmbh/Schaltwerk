# Gefundene Bugs in Schalti Pro

## 🔴 Kritische Bugs

### 1. Dashboard zeigt "Willkommen zurück, Benutzer" statt Benutzername
**Ort:** Dashboard (`/`)
**Beschreibung:** Der Dashboard zeigt "Willkommen zurück, Benutzer" statt dem tatsächlichen Namen des angemeldeten Benutzers (z.B. "Stefan Häring").
**Erwartetes Verhalten:** Sollte den Namen des angemeldeten Benutzers anzeigen.
**Status:** ❌ Nicht behoben

---

## 🟡 Mittlere Bugs

### 2. Breadcrumb zeigt Projekt-ID statt Projektname
**Ort:** Projekt-Detailseite (`/projekte/[id]`)
**Beschreibung:** Im Breadcrumb wird die Projekt-ID (z.B. "66ef416f-dd31-4420-90fb-778e2587108d") angezeigt statt des Projektnamens.
**Erwartetes Verhalten:** Sollte den Projektnamen im Breadcrumb anzeigen.
**Status:** ❌ Nicht behoben

### 3. QR-Code Dialog bleibt nach Projekt-Erstellung offen
**Ort:** Verwaltung → Projekte → Neues Projekt erstellen
**Beschreibung:** Nach dem Erstellen eines neuen Projekts bleibt der QR-Code-Dialog automatisch geöffnet. Dies könnte störend sein, wenn der Benutzer mehrere Projekte schnell hintereinander erstellen möchte.
**Erwartetes Verhalten:** Dialog sollte optional sein oder automatisch schließen (mit Option zum erneuten Öffnen).
**Status:** ⚠️ Möglicherweise gewollt, aber UX könnte verbessert werden

---

## 🟢 Kleine Bugs / Verbesserungen

### 4. "Aktive Projekte" zeigt 0, obwohl Projekte vorhanden sind
**Ort:** Dashboard (`/`)
**Beschreibung:** Die Statistik "Aktive Projekte" zeigt 0, obwohl Projekte mit Status "in_bearbeitung" vorhanden sein könnten. (Hinweis: Aktuell sind alle Projekte auf "Planung", daher könnte dies korrekt sein - muss mit echten Daten getestet werden)
**Status:** ⚠️ Muss mit echten Daten getestet werden

### 5. Keine Fehlermeldung bei fehlgeschlagenen API-Aufrufen
**Ort:** Verschiedene Seiten
**Beschreibung:** Wenn API-Aufrufe fehlschlagen, werden Fehler möglicherweise nicht immer benutzerfreundlich angezeigt.
**Status:** ⚠️ Muss weiter getestet werden

---

## ✅ Behobene Bugs

### ✅ Projekte werden in Verwaltung nicht angezeigt
**Status:** ✅ BEHOBEN - useEffect wurde hinzugefügt

### ✅ 404-Fehler beim Klicken auf Projekte
**Status:** ✅ BEHOBEN - ProjektDetailPage wurde zu Client Component umgewandelt

---

## 📝 Test-Notizen

**Getestete Funktionen:**
- ✅ Login funktioniert
- ✅ Dashboard lädt
- ✅ Projekte-Seite funktioniert
- ✅ Projekt-Detailseite funktioniert (kein 404 mehr)
- ✅ Verwaltung zeigt Projekte an
- ✅ Neues Projekt erstellen funktioniert
- ✅ Projekt erscheint sofort in Projekte-Liste und Verwaltung

**Noch zu testen:**
- ⏳ Protokolle-Seite
- ⏳ Analyse-Seite
- ⏳ Einstellungen-Seite
- ⏳ Komponenten-Verwaltung
- ⏳ Aufgaben-Verwaltung
- ⏳ Checklisten-Verwaltung
- ⏳ Projekt bearbeiten
- ⏳ Projekt löschen
- ⏳ Arbeitsprotokoll erstellen

---

## 🔍 Empfohlene nächste Schritte

1. Dashboard: Benutzername korrekt anzeigen
2. Breadcrumb: Projektname statt ID anzeigen
3. QR-Code Dialog: UX verbessern (optional schließen oder automatisch nach X Sekunden)
4. Weitere Seiten systematisch testen
5. Fehlerbehandlung verbessern


