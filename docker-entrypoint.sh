#!/bin/bash
set -e

echo "🚀 Starting development container..."

# Simple wait for PostgreSQL to be ready (relies on healthcheck)
echo "⏳ Waiting for PostgreSQL..."
sleep 5

# Run database migrations
echo "📊 Running database migrations..."
if echo '1' | pnpm migrations; then
    echo "✅ Migrations completed successfully!"
else
    echo "⚠️ Migrations failed, but continuing..."
fi

# Start the Next.js application
echo "🌟 Starting Next.js application..."
exec pnpm dev --hostname 0.0.0.0
