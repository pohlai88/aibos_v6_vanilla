#!/bin/bash

# AIBOS Production Startup Script
set -e

echo "🚀 Starting AIBOS Production Server..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with production configuration."
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check required environment variables
required_vars=("DATABASE_URL" "SECRET_KEY" "JWT_SECRET")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: Required environment variable $var is not set!"
        exit 1
    fi
done

# Verify database connectivity
echo "🔍 Checking database connectivity..."
python -c "
import psycopg2
import os
try:
    conn = psycopg2.connect(os.getenv('DATABASE_URL'))
    conn.close()
    print('✅ Database connection successful')
except Exception as e:
    print(f'❌ Database connection failed: {e}')
    exit(1)
"

# Run database migrations
echo "🔄 Running database migrations..."
alembic upgrade head

# Start the application
echo "🌟 Starting AIBOS application..."
exec uvicorn main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --workers 4 \
    --access-log \
    --log-level info 