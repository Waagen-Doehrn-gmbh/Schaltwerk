#!/bin/sh
set -e

echo "🚀 Starte SchaltWerk Backend..."

# Warte auf PostgreSQL
echo "⏳ Warte auf PostgreSQL..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" > /dev/null 2>&1; do
  echo "PostgreSQL ist noch nicht bereit. Warte..."
  sleep 2
done

echo "✅ PostgreSQL ist bereit!"

# Führe Migrationen aus
echo "📦 Führe Datenbank-Migrationen aus..."
npx tsx src/migrations/run-migrations.ts

# Starte den Server
echo "🎯 Starte Server..."
exec "$@"


