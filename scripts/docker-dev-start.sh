#!/usr/bin/env zsh

set -e

echo "🚀 Starting Idling.app development environment..."

# Make sure we're in the correct directory
cd /app

# Function to handle cleanup on exit
cleanup() {
    echo "🛑 Shutting down services..."
    kill 0
}
trap cleanup EXIT

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install --legacy-peer-deps

# Install Jekyll dependencies
echo "📚 Installing Jekyll documentation dependencies..."
npm run docs:install

# Ensure proper permissions
chmod +x ./scripts/*.sh

# Start Next.js server in background
echo "🔄 Starting Next.js development server on port 3000..."
npm run dev -- --hostname 0.0.0.0 &
NEXTJS_PID=$!

# Wait a moment for Next.js to start
sleep 5

# Start Jekyll docs server in background
echo "📖 Starting Jekyll documentation server on port 4000..."
npm run docs:dev &
JEKYLL_PID=$!

# Function to check if services are running
check_services() {
    if ! kill -0 $NEXTJS_PID 2>/dev/null; then
        echo "❌ Next.js server died!"
        exit 1
    fi
    
    if ! kill -0 $JEKYLL_PID 2>/dev/null; then
        echo "❌ Jekyll server died!"
        exit 1
    fi
}

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check initial service status
check_services

echo "✅ Development environment ready!"
echo "🌐 Next.js app: http://localhost:3000"
echo "📚 Documentation: http://localhost:4000"

# Keep the script running and monitor services
while true; do
    sleep 30
    check_services
done 