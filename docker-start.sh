#!/bin/bash

# Docker Start Script für Schaltwerk
# Dieses Script baut und startet alle Docker Container

echo "🐳 Starte Docker Setup für Schaltwerk..."
echo ""

# Prüfe ob Docker läuft
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker ist nicht gestartet. Bitte starten Sie Docker Desktop."
    exit 1
fi

# Prüfe ob docker-compose verfügbar ist
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ docker-compose ist nicht verfügbar."
    exit 1
fi

# Verwende docker compose (neue Syntax) falls verfügbar, sonst docker-compose
COMPOSE_CMD="docker-compose"
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
fi

COMPOSE_FILE="docker-compose.yml"
COMPOSE_PROJECT="schaltwerk"

echo "📦 Baue Docker Images..."
$COMPOSE_CMD -f $COMPOSE_FILE -p $COMPOSE_PROJECT build --no-cache

if [ $? -ne 0 ]; then
    echo "❌ Fehler beim Bauen der Images"
    exit 1
fi

echo ""
echo "🚀 Starte Container..."
$COMPOSE_CMD -f $COMPOSE_FILE -p $COMPOSE_PROJECT up -d

if [ $? -ne 0 ]; then
    echo "❌ Fehler beim Starten der Container"
    exit 1
fi

echo ""
echo "⏳ Warte auf Services..."
sleep 5

echo ""
echo "📊 Container Status:"
$COMPOSE_CMD -f $COMPOSE_FILE -p $COMPOSE_PROJECT ps

echo ""
echo "✅ Docker Setup abgeschlossen!"
echo ""
echo "Services sind verfügbar unter:"
echo "  - Frontend:  http://localhost:7000"
echo "  - Backend:   http://localhost:7001"
echo "  - PostgreSQL: localhost:7002"
echo ""
echo "Logs anzeigen mit: $COMPOSE_CMD -f $COMPOSE_FILE -p $COMPOSE_PROJECT logs -f"
echo "Container stoppen mit: $COMPOSE_CMD -f $COMPOSE_FILE -p $COMPOSE_PROJECT down"

