#!/bin/bash

# 🧙‍♂️ Universal Go Installer Script
# Smart cross-platform Go installation for Windows, Ubuntu, and Docker environments
# Works on host machines and inside containers

set -euo pipefail

# Configuration
GO_VERSION="1.21.5"
INSTALL_DIR="/usr/local"
USER_INSTALL_DIR="$HOME/.local"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_step() {
    echo -e "${PURPLE}🔧 $1${NC}"
}

log_header() {
    echo -e "${CYAN}🚀 $1${NC}"
}

# Detect operating system
detect_os() {
    local os=""
    local arch=""
    
    # Check if we're in WSL
    if grep -qEi "(Microsoft|WSL)" /proc/version 2>/dev/null; then
        os="wsl"
    # Check if we're in a Docker container
    elif [ -f /.dockerenv ] || grep -q 'docker\|lxc' /proc/1/cgroup 2>/dev/null; then
        os="docker"
    # Standard OS detection
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [ -f /etc/os-release ]; then
            . /etc/os-release
            case "$ID" in
                ubuntu|debian) os="ubuntu" ;;
                centos|rhel|fedora) os="redhat" ;;
                alpine) os="alpine" ;;
                *) os="linux" ;;
            esac
        else
            os="linux"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        os="macos"
    elif [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        os="windows"
    else
        os="unknown"
    fi
    
    # Detect architecture
    case "$(uname -m)" in
        x86_64) arch="amd64" ;;
        aarch64|arm64) arch="arm64" ;;
        armv7l) arch="armv6l" ;;
        i386|i686) arch="386" ;;
        *) arch="amd64" ;; # Default fallback
    esac
    
    echo "$os:$arch"
}

# Check if Go is already installed
check_go_installed() {
    # Check common installation paths
    local go_paths=(
        "/usr/local/go/bin/go"
        "$HOME/.local/go/bin/go"
        "/usr/bin/go"
        "/opt/go/bin/go"
    )
    
    # First try command -v go (checks PATH)
    if command -v go &> /dev/null; then
        local current_version=$(go version | awk '{print $3}' | sed 's/go//')
        log_info "Go is already installed and in PATH: $current_version"
        
        # Check if it's the version we want
        if [ "$current_version" = "$GO_VERSION" ]; then
            log_success "Go $GO_VERSION is already installed!"
            return 0
        else
            log_warning "Go $current_version is installed, but we need $GO_VERSION"
            return 1
        fi
    fi
    
    # If not in PATH, check common installation locations
    for go_path in "${go_paths[@]}"; do
        if [ -x "$go_path" ]; then
            local current_version=$("$go_path" version 2>/dev/null | awk '{print $3}' | sed 's/go//')
            if [ -n "$current_version" ]; then
                log_info "Go found at $go_path: $current_version (not in PATH)"
                
                # Check if it's the version we want
                if [ "$current_version" = "$GO_VERSION" ]; then
                    log_success "Go $GO_VERSION is already installed at $go_path!"
                    log_info "💡 To use it, run: export PATH=\"$(dirname "$go_path"):\$PATH\""
                    return 0
                else
                    log_warning "Go $current_version found at $go_path, but we need $GO_VERSION"
                    return 1
                fi
            fi
        fi
    done
    
    log_info "Go is not installed"
    return 1
}

# Install Go on Ubuntu/Debian
install_go_ubuntu() {
    log_step "Installing Go on Ubuntu/Debian system..."
    
    # Try package manager first for system-wide install
    if [ "$EUID" -eq 0 ] || sudo -n true 2>/dev/null; then
        log_info "Installing via package manager..."
        
        # Update package list
        sudo apt-get update -qq
        
        # Remove old Go installation if exists
        sudo rm -rf /usr/local/go
        
        # Download and install Go
        local go_tarball="go${GO_VERSION}.linux-amd64.tar.gz"
        local temp_dir=$(mktemp -d)
        
        log_info "Downloading Go ${GO_VERSION}..."
        wget -q --show-progress --timeout=30 --tries=3 \
            -O "$temp_dir/$go_tarball" \
            "https://go.dev/dl/$go_tarball"
        
        log_info "Installing Go to /usr/local..."
        sudo tar -C /usr/local -xzf "$temp_dir/$go_tarball"
        
        # Clean up
        rm -rf "$temp_dir"
        
        # Add to system PATH
        echo 'export PATH="/usr/local/go/bin:$PATH"' | sudo tee /etc/profile.d/go.sh > /dev/null
        chmod +x /etc/profile.d/go.sh
        
        log_success "Go installed system-wide in /usr/local/go"
        
    else
        # User-level installation
        log_info "Installing to user directory (no sudo access)..."
        install_go_user
    fi
}

# Install Go on Red Hat/CentOS/Fedora
install_go_redhat() {
    log_step "Installing Go on Red Hat/CentOS/Fedora system..."
    
    if [ "$EUID" -eq 0 ] || sudo -n true 2>/dev/null; then
        # Remove old Go installation if exists
        sudo rm -rf /usr/local/go
        
        # Download and install Go
        local go_tarball="go${GO_VERSION}.linux-amd64.tar.gz"
        local temp_dir=$(mktemp -d)
        
        log_info "Downloading Go ${GO_VERSION}..."
        wget -q --show-progress --timeout=30 --tries=3 \
            -O "$temp_dir/$go_tarball" \
            "https://go.dev/dl/$go_tarball"
        
        log_info "Installing Go to /usr/local..."
        sudo tar -C /usr/local -xzf "$temp_dir/$go_tarball"
        
        # Clean up
        rm -rf "$temp_dir"
        
        # Add to system PATH
        echo 'export PATH="/usr/local/go/bin:$PATH"' | sudo tee /etc/profile.d/go.sh > /dev/null
        chmod +x /etc/profile.d/go.sh
        
        log_success "Go installed system-wide in /usr/local/go"
    else
        install_go_user
    fi
}

# Install Go on Alpine Linux
install_go_alpine() {
    log_step "Installing Go on Alpine Linux..."
    
    if [ "$EUID" -eq 0 ] || sudo -n true 2>/dev/null; then
        # Try package manager first
        if apk info go 2>/dev/null; then
            log_info "Installing Go via apk..."
            sudo apk add --no-cache go
            log_success "Go installed via Alpine package manager"
        else
            install_go_tarball
        fi
    else
        install_go_user
    fi
}

# Install Go on macOS
install_go_macos() {
    log_step "Installing Go on macOS..."
    
    # Check for Homebrew
    if command -v brew &> /dev/null; then
        log_info "Installing Go via Homebrew..."
        brew install go
        log_success "Go installed via Homebrew"
    else
        log_info "Homebrew not found, installing via tarball..."
        install_go_tarball
    fi
}

# Install Go on Windows (WSL/Git Bash/MSYS2)
install_go_windows() {
    log_step "Installing Go on Windows environment..."
    
    # Check if we're in WSL
    if grep -qEi "(Microsoft|WSL)" /proc/version 2>/dev/null; then
        log_info "Detected WSL environment, using Linux installation..."
        install_go_ubuntu
        return
    fi
    
    # Check for Chocolatey
    if command -v choco &> /dev/null; then
        log_info "Installing Go via Chocolatey..."
        choco install golang -y
        log_success "Go installed via Chocolatey"
    # Check for Scoop
    elif command -v scoop &> /dev/null; then
        log_info "Installing Go via Scoop..."
        scoop install go
        log_success "Go installed via Scoop"
    else
        log_error "No supported package manager found (choco/scoop)"
        log_info "Please install Chocolatey or Scoop, or manually install Go from https://golang.org/dl/"
        log_info "Chocolatey: https://chocolatey.org/install"
        log_info "Scoop: https://scoop.sh/"
        return 1
    fi
}

# Install Go via tarball (generic method)
install_go_tarball() {
    log_step "Installing Go via tarball..."
    
    local install_path
    if [ "$EUID" -eq 0 ] || sudo -n true 2>/dev/null; then
        install_path="$INSTALL_DIR"
        log_info "Installing system-wide to $install_path"
    else
        install_path="$USER_INSTALL_DIR"
        log_info "Installing to user directory $install_path"
        mkdir -p "$install_path"
    fi
    
    # Remove old Go installation if exists
    if [ "$install_path" = "$INSTALL_DIR" ]; then
        sudo rm -rf "$install_path/go"
    else
        rm -rf "$install_path/go"
    fi
    
    # Download and install Go
    local go_tarball="go${GO_VERSION}.linux-amd64.tar.gz"
    local temp_dir=$(mktemp -d)
    
    log_info "Downloading Go ${GO_VERSION}..."
    wget -q --show-progress --timeout=30 --tries=3 \
        -O "$temp_dir/$go_tarball" \
        "https://go.dev/dl/$go_tarball"
    
    log_info "Installing Go to $install_path..."
    if [ "$install_path" = "$INSTALL_DIR" ]; then
        sudo tar -C "$install_path" -xzf "$temp_dir/$go_tarball"
    else
        tar -C "$install_path" -xzf "$temp_dir/$go_tarball"
    fi
    
    # Clean up
    rm -rf "$temp_dir"
    
    # Set up environment
    setup_go_environment "$install_path"
    
    log_success "Go installed to $install_path/go"
}

# Install Go to user directory
install_go_user() {
    log_step "Installing Go to user directory..."
    
    local install_path="$USER_INSTALL_DIR"
    mkdir -p "$install_path"
    
    # Remove old Go installation if exists
    rm -rf "$install_path/go"
    
    # Download and install Go
    local go_tarball="go${GO_VERSION}.linux-amd64.tar.gz"
    local temp_dir=$(mktemp -d)
    
    log_info "Downloading Go ${GO_VERSION}..."
    wget -q --show-progress --timeout=30 --tries=3 \
        -O "$temp_dir/$go_tarball" \
        "https://go.dev/dl/$go_tarball"
    
    log_info "Installing Go to $install_path..."
    tar -C "$install_path" -xzf "$temp_dir/$go_tarball"
    
    # Clean up
    rm -rf "$temp_dir"
    
    # Set up environment
    setup_go_environment "$install_path"
    
    log_success "Go installed to $install_path/go"
}

# Set up Go environment variables
setup_go_environment() {
    local install_path="$1"
    local go_bin="$install_path/go/bin"
    
    log_step "Setting up Go environment..."
    
    # Create environment setup script
    local env_script=""
    
    if [ "$install_path" = "$INSTALL_DIR" ]; then
        # System-wide installation
        env_script="/etc/profile.d/go.sh"
        if [ -w /etc/profile.d ] || sudo -n true 2>/dev/null; then
            cat << EOF | sudo tee "$env_script" > /dev/null
# Go environment variables
export GOROOT="$install_path/go"
export GOPATH="\$HOME/go"
export GOBIN="\$GOPATH/bin"
export PATH="\$GOROOT/bin:\$GOBIN:\$PATH"
EOF
            sudo chmod +x "$env_script"
            log_success "Go environment set up system-wide"
        fi
    else
        # User installation - detect actual shell being used
        local shell_rc=""
        local current_shell=$(ps -p $$ -o comm= 2>/dev/null || echo "unknown")
        
        log_info "Detected current shell: $current_shell"
        
        case "$current_shell" in
            zsh)
                shell_rc="$HOME/.zshrc"
                ;;
            bash)
                shell_rc="$HOME/.bashrc"
                ;;
            fish)
                shell_rc="$HOME/.config/fish/config.fish"
                ;;
            *)
                # Fall back to SHELL environment variable
                if [ "$SHELL" = "/bin/bash" ] || [ "$SHELL" = "/usr/bin/bash" ]; then
                    shell_rc="$HOME/.bashrc"
                elif [ "$SHELL" = "/bin/zsh" ] || [ "$SHELL" = "/usr/bin/zsh" ]; then
                    shell_rc="$HOME/.zshrc"
                else
                    shell_rc="$HOME/.profile"
                fi
                ;;
        esac
        
        # Add Go environment to shell RC file
        if [ -f "$shell_rc" ] || [ "$current_shell" = "fish" ]; then
            # Create config directory for fish if needed
            if [ "$current_shell" = "fish" ]; then
                mkdir -p "$(dirname "$shell_rc")"
                touch "$shell_rc"
            fi
            
            # Remove existing Go configuration
            sed -i '/# Go environment variables/,/^$/d' "$shell_rc" 2>/dev/null || true
            
            # Add new Go configuration based on shell
            if [ "$current_shell" = "fish" ]; then
                cat << EOF >> "$shell_rc"

# Go environment variables
set -gx GOROOT "$install_path/go"
set -gx GOPATH "\$HOME/go"
set -gx GOBIN "\$GOPATH/bin"
set -gx PATH "\$GOROOT/bin" "\$GOBIN" \$PATH
EOF
            else
                cat << EOF >> "$shell_rc"

# Go environment variables
export GOROOT="$install_path/go"
export GOPATH="\$HOME/go"
export GOBIN="\$GOPATH/bin"
export PATH="\$GOROOT/bin:\$GOBIN:\$PATH"
EOF
            fi
            log_success "Go environment added to $shell_rc"
        fi
    fi
    
    # Export for current session
    export GOROOT="$install_path/go"
    export GOPATH="$HOME/go"
    export GOBIN="$GOPATH/bin"
    export PATH="$GOROOT/bin:$GOBIN:$PATH"
    
    # Create GOPATH directories
    mkdir -p "$GOPATH"/{bin,src,pkg}
    
    log_info "Go environment variables:"
    log_info "  GOROOT: $GOROOT"
    log_info "  GOPATH: $GOPATH"
    log_info "  GOBIN: $GOBIN"
}

# Verify Go installation
verify_go_installation() {
    log_step "Verifying Go installation..."
    
    # Source environment if needed
    if [ -f /etc/profile.d/go.sh ]; then
        source /etc/profile.d/go.sh
    fi
    
    # Check if Go is in PATH
    if command -v go &> /dev/null; then
        local installed_version=$(go version | awk '{print $3}' | sed 's/go//')
        log_success "Go is installed and accessible: $installed_version"
        
        # Test Go installation
        log_info "Testing Go installation..."
        local temp_dir=$(mktemp -d)
        cd "$temp_dir"
        
        # Create a simple Go program
        cat << 'EOF' > hello.go
package main

import (
    "fmt"
    "runtime"
)

func main() {
    fmt.Println("🧙‍♂️ Go installation successful!")
    fmt.Printf("Go version: %s\n", runtime.Version())
}
EOF
        
        # Try to run it
        if go run hello.go; then
            log_success "Go test program executed successfully!"
        else
            log_error "Go test program failed to execute"
            return 1
        fi
        
        # Clean up
        cd - > /dev/null
        rm -rf "$temp_dir"
        
        return 0
    else
        log_error "Go is not accessible in PATH"
        log_info "You may need to restart your shell or run:"
        log_info "  source /etc/profile.d/go.sh"
        log_info "  source ~/.bashrc"
        return 1
    fi
}

# Show usage information
show_usage() {
    cat << EOF
🧙‍♂️ Universal Go Installer Script

Usage: $0 [OPTIONS]

Options:
    -h, --help          Show this help message
    -v, --version       Set Go version to install (default: $GO_VERSION)
    -u, --user          Force user-level installation
    -s, --system        Force system-level installation
    -f, --force         Force reinstallation even if Go is already installed
    -d, --dry-run       Show what would be done without actually doing it
    
Examples:
    $0                  # Install Go with auto-detection
    $0 -v 1.20.5        # Install specific Go version
    $0 -u               # Force user-level installation
    $0 -f               # Force reinstallation
    
Supported platforms:
    ✅ Ubuntu/Debian (apt)
    ✅ CentOS/RHEL/Fedora (yum/dnf)
    ✅ Alpine Linux (apk)
    ✅ macOS (brew)
    ✅ Windows (choco/scoop)
    ✅ WSL/WSL2
    ✅ Docker containers
    ✅ Generic Linux (tarball)

EOF
}

# Main installation function
main() {
    local force_install=false
    local user_install=false
    local system_install=false
    local dry_run=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -v|--version)
                GO_VERSION="$2"
                shift 2
                ;;
            -u|--user)
                user_install=true
                shift
                ;;
            -s|--system)
                system_install=true
                shift
                ;;
            -f|--force)
                force_install=true
                shift
                ;;
            -d|--dry-run)
                dry_run=true
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Validate arguments
    if [ "$user_install" = true ] && [ "$system_install" = true ]; then
        log_error "Cannot specify both --user and --system options"
        exit 1
    fi
    
    log_header "Universal Go Installer Script"
    log_info "Target Go version: $GO_VERSION"
    
    # Detect operating system
    local os_info=$(detect_os)
    local os=$(echo "$os_info" | cut -d: -f1)
    local arch=$(echo "$os_info" | cut -d: -f2)
    
    log_info "Detected OS: $os"
    log_info "Detected architecture: $arch"
    
    # Check if Go is already installed
    if [ "$force_install" = false ] && check_go_installed; then
        # If Go is installed but not in PATH, set up environment
        if ! command -v go &> /dev/null; then
            log_step "Setting up Go environment for existing installation..."
            
            # Find the Go installation path
            local go_paths=(
                "/usr/local/go/bin/go"
                "$HOME/.local/go/bin/go"
                "/usr/bin/go"
                "/opt/go/bin/go"
            )
            
            for go_path in "${go_paths[@]}"; do
                if [ -x "$go_path" ]; then
                    local install_path=$(dirname "$(dirname "$go_path")")
                    setup_go_environment "$install_path"
                    log_success "Go environment configured!"
                    break
                fi
            done
        fi
        
        log_info "Use --force to reinstall"
        exit 0
    fi
    
    # Dry run mode
    if [ "$dry_run" = true ]; then
        log_info "Dry run mode - would install Go $GO_VERSION for $os ($arch)"
        exit 0
    fi
    
    # Install Go based on detected OS
    case "$os" in
        ubuntu|debian|wsl)
            if [ "$user_install" = true ]; then
                install_go_user
            else
                install_go_ubuntu
            fi
            ;;
        redhat|centos|fedora)
            if [ "$user_install" = true ]; then
                install_go_user
            else
                install_go_redhat
            fi
            ;;
        alpine)
            if [ "$user_install" = true ]; then
                install_go_user
            else
                install_go_alpine
            fi
            ;;
        macos)
            install_go_macos
            ;;
        windows)
            install_go_windows
            ;;
        docker|linux)
            if [ "$user_install" = true ]; then
                install_go_user
            else
                install_go_tarball
            fi
            ;;
        *)
            log_error "Unsupported operating system: $os"
            log_info "Please install Go manually from https://golang.org/dl/"
            exit 1
            ;;
    esac
    
    # Verify installation
    if verify_go_installation; then
        log_success "Go $GO_VERSION installation completed successfully!"
        log_info ""
        log_info "🎯 Next steps:"
        log_info "  1. Restart your shell or run: source ~/.bashrc"
        log_info "  2. Test Go: go version"
        log_info "  3. Create a Go project: mkdir my-go-project && cd my-go-project"
        log_info "  4. Initialize module: go mod init my-go-project"
        log_info ""
        log_info "🧙‍♂️ Happy coding!"
    else
        log_error "Go installation verification failed"
        exit 1
    fi
}

# Run main function with all arguments
main "$@" 