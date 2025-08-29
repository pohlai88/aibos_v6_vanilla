.PHONY: help install install-dev test test-cov lint format type-check clean run build dev

help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install all dependencies
	pnpm install

install-dev: ## Install development dependencies
	pnpm install
	pre-commit install

build: ## Build all packages
	pnpm run build

dev: ## Start development servers
	pnpm run dev

test: ## Run all tests
	pnpm run test

test-cov: ## Run tests with coverage (when implemented)
	@echo "Coverage reporting to be implemented in Phase 3"

lint: ## Run all linting checks
	pnpm run lint

type-check: ## Run all type checking
	pnpm run typecheck

codegen: ## Generate OpenAPI types
	pnpm run codegen

arch: ## Run architectural validation
	pnpm run arch:ts
	pnpm run arch:py

clean: ## Clean up generated files
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf htmlcov/
	rm -rf .pytest_cache/
	rm -rf .mypy_cache/
	rm -rf dist/
	rm -rf .turbo/
	rm -rf tsconfig.tsbuildinfo

docker-build: ## Build Docker image
	docker build -t aibos-monorepo .

docker-run: ## Run with Docker Compose
	docker-compose up -d

docker-stop: ## Stop Docker Compose
	docker-compose down

check-all: lint type-check test ## Run all checks

pre-commit-all: ## Run all pre-commit hooks
	pre-commit run --all-files

docs: ## Generate API documentation
	@echo "Documentation generation to be implemented in Phase 3"

# Monorepo specific commands
monorepo:install ## Install monorepo dependencies
	pnpm install

monorepo:build ## Build all monorepo packages
	pnpm run build

monorepo:dev ## Start all development servers
	pnpm run dev

monorepo:test ## Run all tests across packages
	pnpm run test

monorepo:lint ## Run all linting across packages
	pnpm run lint

monorepo:typecheck ## Run all type checking across packages
	pnpm run typecheck

monorepo:arch ## Run architectural validation
	pnpm run arch:ts
	pnpm run arch:py

# NOTE: This is a monorepo using pnpm workspaces and Turborepo.
# Use pnpm commands for package management and turbo for task orchestration.
# For development: pnpm run dev
# For building: pnpm run build
# For testing: pnpm run test