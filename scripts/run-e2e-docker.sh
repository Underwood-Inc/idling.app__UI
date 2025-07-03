#!/bin/bash

# Run E2E tests in Docker environment
# This script ensures Playwright browsers are available and runs tests properly

set -e

echo "🎭 Running Playwright E2E tests in Docker environment..."

# Ensure we're in the container
if [ "$IS_DOCKERIZED" != "true" ]; then
    echo "❌ This script should be run inside the Docker container"
    echo "💡 Use: docker-compose exec nextjs ./scripts/run-e2e-docker.sh"
    exit 1
fi

# Check if Playwright browsers are installed
if [ ! -d "/app/.playwright" ] || [ -z "$(ls -A /app/.playwright 2>/dev/null)" ]; then
    echo "📦 Installing Playwright browsers..."
    npx playwright install --with-deps
fi

# Create test results directory if it doesn't exist
mkdir -p test-results playwright-report

# Run the tests with proper configuration
echo "🚀 Starting E2E tests..."
yarn playwright test "$@"

echo "✅ E2E tests completed!" 