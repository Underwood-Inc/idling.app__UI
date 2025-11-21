#!/bin/bash
set -e

echo "ðŸš€ Starting development container..."

# Wait for database to be ready (optional - depends on your setup)
echo "ðŸ“Š Running database migrations..."
if echo '1' | pnpm migrations; then
    echo "âœ… Migrations completed successfully!"
else
    echo "âš ï¸ Migrations failed, but continuing..."
fi

# Start the Next.js application
echo "ðŸŒŸ Starting Next.js application..."
exec npm run dev -- --hostname 0.0.0.0 