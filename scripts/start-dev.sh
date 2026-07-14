#!/bin/bash
set -e

echo "🚀 Starting ForgeFit development environment..."

# 1. Start Docker services
echo "📦 Starting Postgres, Redis, and MinIO..."
docker compose -f docker/docker-compose.yml up -d

# 2. Wait for Postgres
echo "⏳ Waiting for Postgres..."
until docker compose -f docker/docker-compose.yml exec -T postgres pg_isready -U forgefit; do
  sleep 1
done
echo "✅ Postgres is ready"

# 3. Run database migrations
echo "🗄️ Running migrations..."
pnpm db:push

# 4. Seed database
echo "🌱 Seeding database..."
pnpm db:seed

# 5. Start all services in dev mode
echo "🔧 Starting services..."
pnpm dev

echo "🎉 All services running!"
