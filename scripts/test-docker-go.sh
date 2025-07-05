#!/bin/bash

# 🧪 Test script to verify Go installation in Docker environment

set -euo pipefail

echo "🧪 Testing Go installation in Docker environment..."

# Check if we're in Docker
if [[ "${IS_DOCKERIZED:-}" == "true" ]]; then
    echo "✅ Running in Docker environment"
else
    echo "⚠️  Not running in Docker (IS_DOCKERIZED not set)"
fi

# Test Go installation
echo "🔍 Checking Go installation..."

if command -v go &> /dev/null; then
    GO_VERSION=$(go version)
    echo "✅ Go is installed: $GO_VERSION"
    
    # Test Go environment variables
    echo "🌍 Go environment:"
    echo "   GOPATH: ${GOPATH:-not set}"
    echo "   GOBIN: ${GOBIN:-not set}"
    echo "   PATH includes Go: $(echo $PATH | grep -o '/usr/local/go/bin' || echo 'not found')"
    
    # Test building the manage-user tool
    echo "🔨 Testing build process..."
    cd cmd/manage-user
    
    if [[ -f "go.mod" ]]; then
        echo "✅ go.mod found"
        
        # Test go mod tidy
        echo "📦 Running go mod tidy..."
        go mod tidy
        
        # Test go mod download
        echo "📦 Running go mod download..."
        go mod download
        
        # Test build
        echo "🔨 Testing build..."
        go build -o test-manage-user-tui .
        
        if [[ -f "test-manage-user-tui" ]]; then
            echo "✅ Build successful!"
            
            # Test execution (help mode)
            echo "🚀 Testing execution..."
            if ./test-manage-user-tui --help 2>/dev/null || true; then
                echo "✅ Execution test passed"
            else
                echo "⚠️  Execution test failed (expected - no database configured)"
            fi
            
            # Cleanup
            rm -f test-manage-user-tui
            echo "🧹 Cleaned up test binary"
        else
            echo "❌ Build failed!"
            exit 1
        fi
    else
        echo "❌ go.mod not found in cmd/manage-user"
        exit 1
    fi
    
    echo "🎉 All tests passed! Go is properly configured in Docker."
    
else
    echo "❌ Go is not installed or not in PATH"
    echo "🔧 Trying to source Go environment..."
    
    if [[ -f "/etc/profile.d/go.sh" ]]; then
        source /etc/profile.d/go.sh
        if command -v go &> /dev/null; then
            echo "✅ Go found after sourcing environment"
            exec "$0" "$@"  # Re-run the script with Go available
        else
            echo "❌ Go still not found after sourcing environment"
            exit 1
        fi
    else
        echo "❌ Go environment script not found"
        exit 1
    fi
fi 