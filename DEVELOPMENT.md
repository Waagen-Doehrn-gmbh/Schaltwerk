# Development Setup mit Hot Reload

Diese Anleitung erklärt, wie Sie das Projekt im Development-Modus mit Hot Reload starten.

## Voraussetzungen

- Docker und Docker Compose müssen installiert sein
- Ports 7000 (Frontend), 7001 (Backend) und 7002 (PostgreSQL) sollten frei sein

## Development-Modus starten

### 1. Development Container starten

```bash
docker compose -f docker-compose.dev.yml up -d
```

### 2. Logs anzeigen (optional)

```bash
# Alle Services
docker compose -f docker-compose.dev.yml logs -f

# Nur Frontend (um Hot Reload zu sehen)
docker compose -f docker-compose.dev.yml logs -f frontend
```

## Vorteile des Development-Modus

✅ **Hot Reload**: Änderungen am Code werden automatisch erkannt und die Seite neu geladen  
✅ **Schnellere Entwicklung**: Kein Rebuild nötig bei Code-Änderungen  
✅ **Bessere Fehlermeldungen**: Development-Modus zeigt detailliertere Fehler  
✅ **Source Maps**: Besseres Debugging im Browser  

## Unterschiede zu Production

| Feature | Development | Production |
|---------|------------|------------|
| Hot Reload | ✅ Ja | ❌ Nein |
| Build nötig | ❌ Nein | ✅ Ja |
| Source Maps | ✅ Ja | ❌ Nein |
| Performance | Langsamer | Optimiert |
| Error Messages | Detailliert | Minimiert |

## Container stoppen

```bash
docker compose -f docker-compose.dev.yml down
```

## Wichtige Hinweise

- **Windows**: Hot Reload funktioniert besser mit `WATCHPACK_POLLING=true` (bereits in docker-compose.dev.yml gesetzt)
- **Änderungen**: Nach Code-Änderungen wird die Seite automatisch neu geladen (kein manueller Refresh nötig)
- **Backend**: Backend unterstützt auch Hot Reload, wenn der Source-Code gemountet ist

## Troubleshooting

### Hot Reload funktioniert nicht

1. Prüfen Sie die Logs: `docker compose -f docker-compose.dev.yml logs frontend`
2. Stellen Sie sicher, dass Volumes korrekt gemountet sind
3. Auf Windows: `WATCHPACK_POLLING=true` sollte gesetzt sein

### Container startet nicht

1. Prüfen Sie, ob Ports frei sind: `netstat -ano | findstr :7000`
2. Prüfen Sie die Logs: `docker compose -f docker-compose.dev.yml logs`

### Änderungen werden nicht erkannt

1. Warten Sie 1-2 Sekunden (Polling-Intervall)
2. Prüfen Sie, ob die Datei wirklich gespeichert wurde
3. Prüfen Sie die Logs auf Fehler


