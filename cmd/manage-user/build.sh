#!/bin/bash

# 🧙‍♂️ Universal TUI Build Script
# Builds the manage-user TUI application cross-platform

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

log_build() {
    echo -e "${BLUE}🔨 $1${NC}" >&2
}

# Get script directory (where this script is located)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Configuration
BINARY_NAME="manage-user-tui"
SOURCE_DIR="$SCRIPT_DIR"
BUILD_FLAGS="-buildvcs=false -trimpath"

# Parse command line arguments
CLEAN=false
CLEAN_ONLY=false
VERBOSE=false
OUTPUT_DIR=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --clean)
            CLEAN=true
            CLEAN_ONLY=true
            shift
            ;;
        --clean-before-build)
            CLEAN=true
            CLEAN_ONLY=false
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --output|-o)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --clean              Clean build artifacts only"
            echo "  --clean-before-build Clean build artifacts before building"
            echo "  --verbose            Enable verbose output"
            echo "  --output -o          Specify output directory"
            echo "  --help -h            Show this help message"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Set output directory if not specified
if [ -z "$OUTPUT_DIR" ]; then
    OUTPUT_DIR="$SOURCE_DIR"
fi

# Clean function
clean_build() {
    log_info "Cleaning build artifacts..."
    rm -f "$OUTPUT_DIR/$BINARY_NAME"
    rm -f "$OUTPUT_DIR/$BINARY_NAME.exe"
}

# Check Go environment
check_go_environment() {
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

# Build function
build_tui() {
    log_build "Building TUI application..."
    
    # Change to source directory
    cd "$SOURCE_DIR"
    
    # Set build environment
    export CGO_ENABLED=0
    
    # Build command
    local build_cmd="go build $BUILD_FLAGS"
    
    # Add output flag if different from source directory
    if [ "$OUTPUT_DIR" != "$SOURCE_DIR" ]; then
        build_cmd="$build_cmd -o $OUTPUT_DIR/$BINARY_NAME"
    else
        build_cmd="$build_cmd -o $BINARY_NAME"
    fi
    
    # Add source directory
    build_cmd="$build_cmd ."
    
    # Execute build
    if [ "$VERBOSE" = true ]; then
        log_build "Executing: $build_cmd"
        eval "$build_cmd"
    else
        eval "$build_cmd" 2>&1
    fi
    
    # Check if build was successful
    local expected_binary="$OUTPUT_DIR/$BINARY_NAME"
    if [ ! -f "$expected_binary" ] && [ ! -f "$expected_binary.exe" ]; then
        log_error "Build failed - binary not found"
        return 1
    fi
    
    # Make binary executable (in case it's not already)
    chmod +x "$expected_binary" 2>/dev/null || true
    
    return 0
}

# Show build info
show_build_info() {
    log_info "Build Information:"
    echo "  📍 Go Version: $(go version)" >&2
    echo "  📁 Source Directory: $SOURCE_DIR" >&2
    echo "  📂 Output Directory: $OUTPUT_DIR" >&2
    echo "  🔧 Binary Name: $BINARY_NAME" >&2
    echo "  🚀 Build Flags: $BUILD_FLAGS" >&2
}

# Main function
main() {
    log_info "Starting TUI build process..."
    
    # Check Go environment
    if ! check_go_environment; then
        exit 1
    fi
    
    # Show build info
    if [ "$VERBOSE" = true ]; then
        show_build_info
    fi
    
    # Clean if requested
    if [ "$CLEAN" = true ]; then
        clean_build
        if [ "$CLEAN_ONLY" = true ]; then
            log_info "Clean completed successfully!"
            return 0
        fi
    fi
    
    # Build the TUI
    if build_tui; then
        log_info "Build completed successfully!"
        
        # Show final binary location
        local final_binary="$OUTPUT_DIR/$BINARY_NAME"
        if [ -f "$final_binary.exe" ]; then
            final_binary="$final_binary.exe"
        fi
        echo "  📦 Binary location: $final_binary" >&2
        
        # Show binary info
        if [ "$VERBOSE" = true ] && [ -f "$final_binary" ]; then
            echo "  📏 Binary size: $(du -h "$final_binary" | cut -f1)" >&2
        fi
    else
        log_error "Build failed!"
        exit 1
    fi
}

# Run main function
main "$@" 