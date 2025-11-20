# n8n Workflows für SchaltWerk

Diese Workflows integrieren SchaltWerk mit Microsoft Teams, um Arbeitsschritte und Chat-Nachrichten automatisch zu dokumentieren.

## Voraussetzungen

1. **n8n installiert** (Docker, Cloud oder lokal)
2. **Microsoft Teams Credentials** in n8n konfiguriert
3. **Backend läuft** und ist erreichbar

## Installation

### 1. Microsoft Teams Credentials in n8n einrichten

1. Öffne n8n → **Credentials** → **Add Credential**
2. Wähle **Microsoft Teams OAuth2 API**
3. Folge der Anleitung zur Azure App Registration:
   - Erstelle eine Azure App Registration
   - Füge folgende Berechtigungen hinzu:
     - `Chat.ReadWrite`
     - `ChatMessage.Send`
   - Kopiere Client ID und Client Secret nach n8n

### 2. Teams Chat ID finden

**Option A: Über Teams URL**
1. Öffne den gewünschten Teams Chat
2. Die Chat-ID steht in der URL: `https://teams.microsoft.com/l/chat/0/0?tenantId=...&topicId=CHAT_ID`
3. Kopiere die `topicId` (oder die gesamte Chat-ID)

**Option B: Über Graph API**
```bash
# Liste alle Chats auf
GET https://graph.microsoft.com/v1.0/chats
```

### 3. Environment-Variablen setzen

In n8n → **Settings** → **Environment Variables**:

```env
TEAMS_CHAT_ID=19:meeting_xxx@thread.v2  # Deine Teams Chat ID
```

Oder direkt in den Workflow-Nodes die Chat-ID eintragen.

### 4. Workflows importieren

1. Öffne n8n → **Workflows** → **Import from File**
2. Importiere `schalti-protokolle-to-teams.json` (oder `schaltwerk-protokolle-to-teams.json`)
3. Importiere `schalti-chat-to-teams.json` (oder `schaltwerk-chat-to-teams.json`)

### 5. Webhook-URLs kopieren

Nach dem Import:
1. Öffne jeden Workflow
2. Klicke auf den **Webhook Node**
3. Kopiere die **Production URL** (z.B. `https://your-n8n.com/webhook/protokoll`)
4. Diese URL wird im Backend benötigt

### 6. Backend konfigurieren

Füge die n8n Webhook-URL zur `.env` Datei hinzu:

```env
N8N_WEBHOOK_URL=https://your-n8n.com/webhook
```

**Wichtig:** Die URL sollte **ohne** den spezifischen Pfad (`/protokoll` oder `/chat`) sein, da das Backend diese automatisch anhängt.

## Workflow-Details

### Workflow 1: Protokolle → Teams

**Trigger:** Webhook von Backend  
**Pfad:** `/protokoll`

**Ablauf:**
1. Empfängt `protokollId` vom Backend
2. Ruft Backend-API auf, um vollständige Protokoll-Daten zu holen
3. Filtert nach "Abnahme"-Aufgaben (optional)
4. Sendet formatierte Nachricht an Teams

**Nachrichten-Format:**
- Abnahme-Aufgaben: Erweiterte Nachricht mit Abnahme-Status
- Andere Aufgaben: Standard-Nachricht

### Workflow 2: Chat → Teams

**Trigger:** Webhook von Backend  
**Pfad:** `/chat`

**Ablauf:**
1. Empfängt `messageId` vom Backend
2. Ruft Backend-API auf, um vollständige Chat-Daten zu holen
3. Sendet formatierte Nachricht an Teams

**Nachrichten-Format:**
- Projekt-Name
- Schaltschrank-Nummer
- Benutzer-Name
- Nachrichtentext
- Bild-Link (falls vorhanden)

## Anpassungen

### Filter anpassen

Im Workflow "Protokolle → Teams" kannst du den Filter anpassen:

**Nur bestimmte Aufgaben:**
- Ändere die Bedingung im "Filter - Nur Abnahmen" Node
- Beispiel: `{{ $json.aufgabe }}` enthält "Technische Abnahme"

**Alle Protokolle:**
- Entferne den Filter-Node
- Verbinde direkt "HTTP Request" mit "Teams - Sende Nachricht (Alle)"

### Nachrichten-Format anpassen

Bearbeite den `message` Parameter im Teams Node:

```javascript
=📋 **Neuer Arbeitsschritt**

**Projekt:** {{ $json.projektName }}
**Aufgabe:** {{ $json.aufgabe }}
// ... weitere Felder
```

### Backend-URL anpassen

Falls das Backend nicht auf `localhost:7001` läuft, ändere die URL im HTTP Request Node:

```
http://your-backend-url:port/api/webhook/protokoll
```

## Troubleshooting

### Webhook wird nicht ausgelöst

1. Prüfe, ob `N8N_WEBHOOK_URL` in der Backend `.env` gesetzt ist
2. Prüfe Backend-Logs auf Fehler
3. Teste Webhook manuell:
   ```bash
   curl -X POST http://localhost:7001/api/webhook/protokoll \
     -H "Content-Type: application/json" \
     -d '{"protokollId": "YOUR_PROTOKOLL_ID"}'
   ```

### Teams-Nachricht wird nicht gesendet

1. Prüfe Microsoft Teams Credentials in n8n
2. Prüfe, ob Chat-ID korrekt ist
3. Prüfe n8n Execution Logs
4. Teste Teams-Verbindung manuell in n8n

### Backend-API-Fehler

1. Prüfe, ob Backend läuft
2. Prüfe Datenbank-Verbindung
3. Prüfe Backend-Logs

## API-Endpunkte

Das Backend stellt folgende Webhook-Endpunkte bereit:

- `POST /api/webhook/protokoll` - Hole Protokoll-Daten
  - Body: `{ "protokollId": "uuid" }`
  - Response: Protokoll-Daten mit Projekt und Benutzer

- `POST /api/webhook/chat` - Hole Chat-Daten
  - Body: `{ "messageId": "uuid" }`
  - Response: Chat-Daten mit Projekt und Benutzer

## Support

Bei Problemen:
1. Prüfe n8n Execution Logs
2. Prüfe Backend-Logs
3. Teste Webhook-Endpunkte manuell
4. Prüfe Teams Credentials

