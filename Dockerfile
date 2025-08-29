# Multi-stage build for AIBOS Monorepo
# Stage 1: Frontend build
FROM node:18-alpine AS frontend-builder

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/shared/package.json ./packages/shared/

RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# Stage 2: Backend build
FROM python:3.11-slim AS backend-builder

WORKDIR /app
COPY apps/api-python/pyproject.toml ./apps/api-python/
COPY packages/backend/pyproject.toml ./packages/backend/

RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -e ./packages/backend
RUN pip install --no-cache-dir -e ./apps/api-python

# Stage 3: Production runtime
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        curl \
        nginx \
    && rm -rf /var/lib/apt/lists/*

# Copy built frontend
COPY --from=frontend-builder /app/apps/frontend/dist /app/static

# Copy backend application
COPY --from=backend-builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY apps/api-python /app/api
COPY packages/backend /app/backend

# Copy configuration files
COPY config /app/config
COPY .env.example /app/.env

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser \
    && chown -R appuser:appuser /app
USER appuser

# Expose ports
EXPOSE 8000 3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"] 