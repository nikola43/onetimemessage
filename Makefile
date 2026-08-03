.PHONY: help dev build run stop clean test

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development
dev-backend: ## Run backend in development mode
	cd backend && cargo run

dev-frontend: ## Run frontend in development mode
	cd frontend && npm run dev

# Docker commands
build: ## Build all Docker images
	docker-compose build

run: ## Start all services
	docker-compose up -d

stop: ## Stop all services
	docker-compose down

logs: ## View logs
	docker-compose logs -f

# Database
db-up: ## Start MySQL only
	docker-compose up -d mysql

db-migrate: ## Run database migrations
	cd backend && diesel migration run

# Utilities
generate-key: ## Generate a new encryption key
	@openssl rand -hex 32

clean: ## Clean build artifacts
	cd backend && cargo clean
	cd frontend && rm -rf .next node_modules
	docker-compose down -v

# Testing
test-backend: ## Run backend tests
	cd backend && cargo test

# Setup
setup: ## Initial setup (copy env files)
	@cp -n .env.example .env 2>/dev/null || true
	@cp -n backend/.env.example backend/.env 2>/dev/null || true
	@cp -n frontend/.env.example frontend/.env.local 2>/dev/null || true
	@echo "Environment files created. Please update them with your values."
	@echo "Generate an encryption key with: make generate-key"
