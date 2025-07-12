#!/bin/bash
set -e

echo "🚀 Starting development container..."

# Wait for database to be ready (optional - depends on your setup)
echo "📊 Running database migrations..."
if echo '1' | pnpm migrations; then
    echo "✅ Migrations completed successfully!"
else
    echo "⚠️ Migrations failed, but continuing..."
fi

# Start the Next.js application
echo "🌟 Starting Next.js application..."
exec npm run dev -- --hostname 0.0.0.0 