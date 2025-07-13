#!/bin/bash

# 🧙‍♂️ Simple Go Environment Setup Script
# Ensures Go is available and sets up basic environment

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}✅ $1${NC}" >&2
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}" >&2
}

log_error() {
    echo -e "${RED}❌ $1${NC}" >&2
}

# Check if Go is available
check_go_available() {
    if ! command -v go &> /dev/null; then
        log_error "Go is not installed or not in PATH"
        log_error "Please run: pnpm go:install"
        return 1
    fi
    
    if ! go version &> /dev/null; then
        log_error "Go command found but not working properly"
        return 1
    fi
    
    return 0
}

# Setup Go environment using Go's own tools
setup_go_environment() {
    # Use Go's built-in environment detection
    local goroot gopath gobin
    
    # Get Go environment variables using Go itself
    goroot=$(go env GOROOT)
    gopath=$(go env GOPATH)
    gobin=$(go env GOBIN)
    
    # Set environment variables
    export GOROOT="$goroot"
    export GOPATH="$gopath"
    
    # Set GOBIN if not already set
    if [ -z "$gobin" ]; then
        export GOBIN="$gopath/bin"
    else
        export GOBIN="$gobin"
    fi
    
    # Ensure Go binary directory is in PATH
    go_bin_dir="$goroot/bin"
    if [[ ":$PATH:" != *":$go_bin_dir:"* ]]; then
        export PATH="$go_bin_dir:$PATH"
    fi
    
    # Ensure GOBIN is in PATH
    if [[ ":$PATH:" != *":$GOBIN:"* ]]; then
        export PATH="$GOBIN:$PATH"
    fi
    
    return 0
}

# Display environment information
show_environment_info() {
    log_info "Go Environment Information:"
    echo "  📍 Go Version: $(go version)" >&2
    echo "  📁 GOROOT: $GOROOT" >&2
    echo "  📂 GOPATH: $GOPATH" >&2
    echo "  🔧 GOBIN: $GOBIN" >&2
}

# Main function
main() {
    # Check if Go is available
    if ! check_go_available; then
        exit 1
    fi
    
    # Setup Go environment
    if ! setup_go_environment; then
        log_error "Failed to setup Go environment"
        exit 1
    fi
    
    # Show environment info
    show_environment_info
    
    # If arguments provided, execute them with proper Go environment
    if [ $# -gt 0 ]; then
        log_info "Executing: $*"
        exec "$@"
    fi
}

# Run main function with all arguments
main "$@" 