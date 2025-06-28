.PHONY: help install install-dev test test-cov lint format type-check clean run migrate seed-demo

help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install production dependencies
	pip install -e .

install-dev: ## Install development dependencies
	pip install -e ".[dev,test]"
	pre-commit install

test: ## Run tests
	pytest tests/ -v

test-cov: ## Run tests with coverage
	pytest tests/ --cov=packages --cov-report=html --cov-report=term-missing

lint: ## Run linting checks
	flake8 packages/ tests/
	black --check packages/ tests/
	isort --check-only packages/ tests/

format: ## Format code
	black packages/ tests/
	isort packages/ tests/

type-check: ## Run type checking
	mypy packages/

clean: ## Clean up generated files
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf htmlcov/
	rm -rf .pytest_cache/
	rm -rf .mypy_cache/

run: ## Run the development server
	uvicorn main:app --reload --host 0.0.0.0 --port 8000

run-prod: ## Run the production server
	uvicorn main:app --host 0.0.0.0 --port 8000

migrate: ## Run database migrations
	alembic upgrade head

seed-demo: ## Seed demo data
	python scripts/seed_demo_data.py

docker-build: ## Build Docker image
	docker build -t aibos-ledger .

docker-run: ## Run with Docker Compose
	docker-compose up -d

docker-stop: ## Stop Docker Compose
	docker-compose down

check-all: lint type-check test ## Run all checks

pre-commit-all: ## Run all pre-commit hooks
	pre-commit run --all-files

docs: ## Generate API documentation
	python scripts/generate_docs.py

jupyter: ## Start Jupyter notebook
	jupyter notebook --ip=0.0.0.0 --port=8888 --no-browser --allow-root 