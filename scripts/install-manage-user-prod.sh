#!/bin/bash

# 🎯 Production Installation Script for User Management TUI
# This script installs Go and builds the manage-user tool for production servers

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MANAGE_USER_DIR="$PROJECT_ROOT/cmd/manage-user"
GO_VERSION="1.21.5"
INSTALL_DIR="/usr/local/bin"
SERVICE_USER="idling"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_warning "Running as root. This is recommended for production installation."
        return 0
    else
        log_error "This script should be run as root for system-wide installation."
        log_info "Run with: sudo $0"
        exit 1
    fi
}

# Check system requirements
check_system() {
    log_step "Checking system requirements..."
    
    # Check OS
    if [[ ! -f /etc/os-release ]]; then
        log_error "Cannot determine OS. This script supports Ubuntu/Debian systems."
        exit 1
    fi
    
    . /etc/os-release
    if [[ "$ID" != "ubuntu" && "$ID" != "debian" ]]; then
        log_warning "This script is designed for Ubuntu/Debian. Proceeding anyway..."
    fi
    
    # Check architecture
    ARCH=$(uname -m)
    case $ARCH in
        x86_64) GO_ARCH="amd64" ;;
        aarch64) GO_ARCH="arm64" ;;
        armv7l) GO_ARCH="armv6l" ;;
        *) 
            log_error "Unsupported architecture: $ARCH"
            exit 1
            ;;
    esac
    
    log_success "System check passed: $ID $VERSION_ID ($ARCH)"
}

# Install system dependencies
install_dependencies() {
    log_step "Installing system dependencies..."
    
    apt-get update
    apt-get install -y \
        curl \
        wget \
        git \
        build-essential \
        ca-certificates \
        postgresql-client \
        jq
    
    log_success "System dependencies installed"
}

# Install Go
install_go() {
    log_step "Installing Go $GO_VERSION..."
    
    # Check if Go is already installed
    if command -v go &> /dev/null; then
        CURRENT_VERSION=$(go version | cut -d' ' -f3 | sed 's/go//')
        if [[ "$CURRENT_VERSION" == "$GO_VERSION" ]]; then
            log_success "Go $GO_VERSION is already installed"
            return 0
        else
            log_warning "Go $CURRENT_VERSION is installed, but we need $GO_VERSION"
            log_step "Removing existing Go installation..."
            rm -rf /usr/local/go
        fi
    fi
    
    # Download and install Go
    GO_TARBALL="go${GO_VERSION}.linux-${GO_ARCH}.tar.gz"
    GO_URL="https://go.dev/dl/${GO_TARBALL}"
    
    log_info "Downloading Go from: $GO_URL"
    
    cd /tmp
    wget -q --show-progress "$GO_URL"
    
    log_step "Extracting Go to /usr/local/go..."
    tar -C /usr/local -xzf "$GO_TARBALL"
    rm "$GO_TARBALL"
    
    # Set up Go environment
    cat > /etc/profile.d/go.sh << 'EOF'
# Go environment variables
export PATH="/usr/local/go/bin:$PATH"
export GOPATH="/opt/go"
export GOBIN="/opt/go/bin"
export PATH="$GOBIN:$PATH"
EOF
    
    chmod +x /etc/profile.d/go.sh
    
    # Create Go workspace
    mkdir -p /opt/go/{bin,src,pkg}
    
    # Source the environment for this session
    source /etc/profile.d/go.sh
    
    # Verify installation
    if command -v go &> /dev/null; then
        INSTALLED_VERSION=$(go version | cut -d' ' -f3 | sed 's/go//')
        log_success "Go $INSTALLED_VERSION installed successfully"
    else
        log_error "Go installation failed"
        exit 1
    fi
}

# Create service user
create_service_user() {
    log_step "Creating service user '$SERVICE_USER'..."
    
    if id "$SERVICE_USER" &>/dev/null; then
        log_success "User '$SERVICE_USER' already exists"
    else
        useradd -r -s /bin/bash -d /opt/idling -m "$SERVICE_USER"
        log_success "Created user '$SERVICE_USER'"
    fi
    
    # Create directories
    mkdir -p /opt/idling/{bin,logs,config}
    chown -R "$SERVICE_USER:$SERVICE_USER" /opt/idling
}

# Build the manage-user tool
build_tool() {
    log_step "Building User Management TUI..."
    
    if [[ ! -d "$MANAGE_USER_DIR" ]]; then
        log_error "manage-user directory not found: $MANAGE_USER_DIR"
        log_info "Please ensure this script is run from the project root or that the project is properly deployed"
        exit 1
    fi
    
    cd "$MANAGE_USER_DIR"
    
    # Verify Go modules
    if [[ ! -f "go.mod" ]]; then
        log_error "go.mod not found in $MANAGE_USER_DIR"
        exit 1
    fi
    
    # Build the application
    log_info "Building application..."
    
    # Set build environment
    export CGO_ENABLED=0
    export GOOS=linux
    export GOARCH="$GO_ARCH"
    
    # Build with optimizations
    go build -ldflags="-w -s" -o manage-user-tui .
    
    if [[ ! -f "manage-user-tui" ]]; then
        log_error "Build failed - executable not found"
        exit 1
    fi
    
    log_success "Build completed successfully"
    
    # Install the binary
    log_step "Installing binary to $INSTALL_DIR..."
    
    cp manage-user-tui "$INSTALL_DIR/manage-user-tui"
    chmod +x "$INSTALL_DIR/manage-user-tui"
    
    # Also install to service user directory
    cp manage-user-tui "/opt/idling/bin/manage-user-tui"
    chown "$SERVICE_USER:$SERVICE_USER" "/opt/idling/bin/manage-user-tui"
    chmod +x "/opt/idling/bin/manage-user-tui"
    
    log_success "Binary installed to $INSTALL_DIR and /opt/idling/bin"
}

# Create configuration template
create_config() {
    log_step "Creating configuration template..."
    
    cat > /opt/idling/config/manage-user.env << 'EOF'
# Database Configuration
# Copy this file to /opt/idling/config/manage-user.env.local and configure
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# Optional: Debug mode
# DEBUG=1

# Optional: Performance metrics
# PERF_METRICS=1

# Optional: Log level (debug, info, warn, error)
# LOG_LEVEL=info
EOF
    
    chown "$SERVICE_USER:$SERVICE_USER" /opt/idling/config/manage-user.env
    chmod 600 /opt/idling/config/manage-user.env
    
    log_success "Configuration template created at /opt/idling/config/manage-user.env"
    log_warning "Please copy this file to manage-user.env.local and configure your database settings"
}

# Create wrapper script
create_wrapper() {
    log_step "Creating wrapper script..."
    
    cat > "$INSTALL_DIR/manage-user" << 'EOF'
#!/bin/bash

# User Management TUI Wrapper Script
# This script loads the environment and runs the TUI tool

set -euo pipefail

CONFIG_DIR="/opt/idling/config"
LOG_DIR="/opt/idling/logs"
BIN_PATH="/opt/idling/bin/manage-user-tui"

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Load configuration if available
if [[ -f "$CONFIG_DIR/manage-user.env.local" ]]; then
    source "$CONFIG_DIR/manage-user.env.local"
elif [[ -f "$CONFIG_DIR/manage-user.env" ]]; then
    echo "⚠️  Using default configuration. Please create manage-user.env.local with your settings."
    source "$CONFIG_DIR/manage-user.env"
else
    echo "❌ No configuration found. Please create $CONFIG_DIR/manage-user.env.local"
    echo "📝 Template available at: $CONFIG_DIR/manage-user.env"
    exit 1
fi

# Check if running as root
if [[ $EUID -eq 0 ]]; then
    echo "⚠️  Running as root. Consider running as the idling user for better security:"
    echo "   sudo -u idling manage-user"
    echo ""
fi

# Log the execution
echo "$(date '+%Y-%m-%d %H:%M:%S') - User Management TUI started by $(whoami)" >> "$LOG_DIR/manage-user.log"

# Run the tool with all arguments passed through
exec "$BIN_PATH" "$@"
EOF
    
    chmod +x "$INSTALL_DIR/manage-user"
    
    log_success "Wrapper script created at $INSTALL_DIR/manage-user"
}

# Create systemd service (optional)
create_service() {
    log_step "Creating systemd service template..."
    
    cat > /etc/systemd/system/manage-user@.service << 'EOF'
[Unit]
Description=User Management TUI for user %i
After=network.target postgresql.service

[Service]
Type=forking
User=idling
Group=idling
WorkingDirectory=/opt/idling
EnvironmentFile=/opt/idling/config/manage-user.env.local
ExecStart=/opt/idling/bin/manage-user-tui %i
StandardOutput=append:/opt/idling/logs/manage-user.log
StandardError=append:/opt/idling/logs/manage-user-error.log
Restart=no
RemainAfterExit=no

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    
    log_success "Systemd service template created"
    log_info "Usage: systemctl start manage-user@<user_id_or_username>"
}

# Verify installation
verify_installation() {
    log_step "Verifying installation..."
    
    # Check Go installation
    if ! command -v go &> /dev/null; then
        log_error "Go is not in PATH"
        return 1
    fi
    
    # Check binary installation
    if [[ ! -f "$INSTALL_DIR/manage-user-tui" ]]; then
        log_error "Binary not found at $INSTALL_DIR/manage-user-tui"
        return 1
    fi
    
    # Check wrapper script
    if [[ ! -f "$INSTALL_DIR/manage-user" ]]; then
        log_error "Wrapper script not found at $INSTALL_DIR/manage-user"
        return 1
    fi
    
    # Test binary execution (help mode)
    if "$INSTALL_DIR/manage-user-tui" --help &>/dev/null; then
        log_success "Binary execution test passed"
    else
        log_warning "Binary execution test failed (this may be normal if database is not configured)"
    fi
    
    log_success "Installation verification completed"
}

# Print usage instructions
print_usage() {
    log_success "🎉 Installation completed successfully!"
    echo ""
    echo -e "${PURPLE}📋 Next Steps:${NC}"
    echo ""
    echo "1. Configure the database connection:"
    echo "   sudo cp /opt/idling/config/manage-user.env /opt/idling/config/manage-user.env.local"
    echo "   sudo nano /opt/idling/config/manage-user.env.local"
    echo ""
    echo "2. Test the installation:"
    echo "   manage-user --help"
    echo ""
    echo "3. Run the tool:"
    echo "   manage-user                    # Interactive mode"
    echo "   manage-user 123               # Direct user lookup by ID"
    echo "   manage-user \"john doe\"        # Direct user lookup by username"
    echo ""
    echo "4. Run as service user (recommended):"
    echo "   sudo -u idling manage-user"
    echo ""
    echo "5. Enable debug mode:"
    echo "   DEBUG=1 manage-user"
    echo ""
    echo -e "${PURPLE}📁 Installation Paths:${NC}"
    echo "   Binary: $INSTALL_DIR/manage-user-tui"
    echo "   Wrapper: $INSTALL_DIR/manage-user"
    echo "   Config: /opt/idling/config/"
    echo "   Logs: /opt/idling/logs/"
    echo ""
    echo -e "${PURPLE}🔧 Service Management:${NC}"
    echo "   systemctl start manage-user@<user_id>"
    echo "   systemctl status manage-user@<user_id>"
    echo ""
}

# Main installation function
main() {
    echo -e "${PURPLE}"
    echo "🎯 User Management TUI - Production Installation"
    echo "=============================================="
    echo -e "${NC}"
    
    check_root
    check_system
    install_dependencies
    install_go
    create_service_user
    build_tool
    create_config
    create_wrapper
    create_service
    verify_installation
    print_usage
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        echo "User Management TUI - Production Installation Script"
        echo ""
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --help, -h          Show this help message"
        echo "  --go-version VER    Install specific Go version (default: $GO_VERSION)"
        echo "  --install-dir DIR   Install binaries to DIR (default: $INSTALL_DIR)"
        echo "  --service-user USER Create service user USER (default: $SERVICE_USER)"
        echo ""
        echo "This script will:"
        echo "  1. Install Go $GO_VERSION"
        echo "  2. Create service user '$SERVICE_USER'"
        echo "  3. Build and install the User Management TUI"
        echo "  4. Create configuration templates"
        echo "  5. Set up systemd service"
        echo ""
        echo "Requirements:"
        echo "  - Ubuntu/Debian Linux"
        echo "  - Root access (sudo)"
        echo "  - Internet connection"
        echo "  - PostgreSQL database access"
        echo ""
        exit 0
        ;;
    --go-version)
        GO_VERSION="$2"
        shift 2
        ;;
    --install-dir)
        INSTALL_DIR="$2"
        shift 2
        ;;
    --service-user)
        SERVICE_USER="$2"
        shift 2
        ;;
    "")
        # No arguments, proceed with installation
        ;;
    *)
        log_error "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac

# Run main installation
main "$@" 