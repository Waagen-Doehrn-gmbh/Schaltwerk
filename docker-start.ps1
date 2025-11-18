# Docker Start Script für Schalti (PowerShell)
# Dieses Script baut und startet alle Docker Container

Write-Host "🐳 Starte Docker Setup für Schalti..." -ForegroundColor Cyan
Write-Host ""

# Prüfe ob Docker läuft
try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Docker ist nicht gestartet. Bitte starten Sie Docker Desktop." -ForegroundColor Red
    exit 1
}

# Prüfe ob docker-compose verfügbar ist
$composeCmd = "docker-compose"
try {
    docker compose version | Out-Null
    $composeCmd = "docker compose"
} catch {
    try {
        docker-compose --version | Out-Null
    } catch {
        Write-Host "❌ docker-compose ist nicht verfügbar." -ForegroundColor Red
        exit 1
    }
}

Write-Host "📦 Baue Docker Images..." -ForegroundColor Yellow
& $composeCmd.Split(' ') build --no-cache

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Fehler beim Bauen der Images" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 Starte Container..." -ForegroundColor Yellow
& $composeCmd.Split(' ') up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Fehler beim Starten der Container" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "⏳ Warte auf Services..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "📊 Container Status:" -ForegroundColor Cyan
& $composeCmd.Split(' ') ps

Write-Host ""
Write-Host "✅ Docker Setup abgeschlossen!" -ForegroundColor Green
Write-Host ""
Write-Host "Services sind verfügbar unter:" -ForegroundColor Cyan
Write-Host "  - Frontend:  http://localhost:7000"
Write-Host "  - Backend:   http://localhost:7001"
Write-Host "  - PostgreSQL: localhost:7002"
Write-Host ""
Write-Host "Logs anzeigen mit: $composeCmd logs -f" -ForegroundColor Gray
Write-Host "Container stoppen mit: $composeCmd down" -ForegroundColor Gray

