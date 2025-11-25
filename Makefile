.PHONY: help build up down restart logs clean dev prod

# Standard-Ziel
help:
	@echo "Verfügbare Befehle:"
	@echo "  make build     - Baue alle Docker-Images"
	@echo "  make up        - Starte alle Container (Production)"
	@echo "  make dev       - Starte alle Container (Development)"
	@echo "  make down      - Stoppe alle Container"
	@echo "  make restart   - Starte Container neu"
	@echo "  make logs      - Zeige Logs aller Container"
	@echo "  make clean     - Stoppe Container und entferne Volumes"
	@echo "  make rebuild   - Baue Images neu und starte Container"

# Production
build:
	docker-compose build

up:
	docker-compose up -d

# Development
dev:
	docker-compose -f docker-compose.dev.yml up -d

dev-build:
	docker-compose -f docker-compose.dev.yml build

dev-logs:
	docker-compose -f docker-compose.dev.yml logs -f

# Allgemeine Befehle
down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

logs-db:
	docker-compose logs -f postgres

# Cleanup
clean:
	docker-compose down -v

# Rebuild
rebuild:
	docker-compose build --no-cache
	docker-compose up -d

# Shell-Zugriff
shell-backend:
	docker exec -it schaltwerk-backend sh

shell-frontend:
	docker exec -it schaltwerk-frontend sh

shell-db:
	docker exec -it schaltwerk-postgres psql -U postgres -d schaltwerk_pro

# Migrationen
migrate:
	docker exec -it schaltwerk-backend npm run migrate

seed:
	docker exec -it schaltwerk-backend npm run seed


