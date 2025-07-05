#!/bin/bash

# 🧙‍♂️ Build script for the modern Bubble Tea manage-user application

set -e

echo "🚀 Building Bubble Tea User Management Tool..."

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo "❌ Go is not installed."
    echo ""
    echo "🐳 If you're in Docker, Go should be available. Try:"
    echo "   source /etc/profile.d/go.sh"
    echo "   export PATH=\"/usr/local/go/bin:\$PATH\""
    echo ""
    echo "💡 For local installation, install Go from: https://golang.org/dl/"
    echo "📋 Or use your package manager:"
    echo "   - Ubuntu/Debian: sudo apt install golang-go"
    echo "   - macOS: brew install go"
    echo "   - Windows: choco install golang"
    echo ""
    echo "🔧 For production deployment, use:"
    echo "   sudo scripts/install-manage-user-prod.sh"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "go.mod" ]; then
    echo "❌ go.mod not found. Please run this script from the cmd/manage-user directory."
    exit 1
fi

# Download dependencies
echo "📦 Downloading dependencies..."
go mod tidy
go mod download

# Build the application
echo "🔨 Building application..."
go build -o manage-user-tui .

# Check if build was successful
if [ -f "manage-user-tui" ]; then
    echo "✅ Build successful! Executable created: manage-user-tui"
    echo ""
    echo "🎯 Usage:"
    echo "  ./manage-user-tui                    # Start interactive mode"
    echo "  ./manage-user-tui 123               # Load user by ID"
    echo "  ./manage-user-tui \"john doe\"        # Search for user by name"
    echo ""
    echo "📋 Make sure to:"
    echo "  1. Set up your .env.local file with database credentials"
    echo "  2. Ensure your database is running and accessible"
    echo ""
    echo "🧙‍♂️ Ready to manage users with style!"
else
    echo "❌ Build failed!"
    exit 1
fi 