---
layout: default
title: 'Docker Go Setup & Production Deployment'
description: 'Summary of Docker Go integration and production deployment setup for the User Management TUI'
permalink: /infrastructure/docker-go-setup/
---

# 🐳 Docker Go Setup & Production Deployment

## 📋 Overview

This document summarizes the infrastructure changes made to support the new Bubble Tea User Management TUI, including Docker Go integration and production deployment automation.

## 🔧 Changes Made

### 1. Docker Integration

#### Updated Dockerfile

- **Added Go 1.21.5 installation** to the main Docker image
- **Configured Go environment variables** (GOPATH, GOBIN, PATH)
- **Created Go workspace** at `/go` directory
- **Updated zsh configuration** to include Go in PATH

#### Key Changes:

```dockerfile
# Install Go 1.21.x
ENV GO_VERSION=1.21.5
RUN wget -q https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz && \
  tar -C /usr/local -xzf go${GO_VERSION}.linux-amd64.tar.gz && \
  rm go${GO_VERSION}.linux-amd64.tar.gz

# Set Go environment variables
ENV PATH="/usr/local/go/bin:${PATH}"
ENV GOPATH="/go"
ENV GOBIN="/go/bin"
ENV PATH="${GOBIN}:${PATH}"
```

### 2. Production Deployment Script

#### Created `scripts/install-manage-user-prod.sh`

A comprehensive production installation script that:

- **System Requirements Check**: Validates OS and architecture
- **Go Installation**: Downloads and installs Go 1.21.5
- **Service User Creation**: Creates dedicated `idling` user
- **Application Build**: Compiles the manage-user tool
- **Configuration Setup**: Creates environment templates
- **System Integration**: Installs binaries and wrapper scripts
- **Systemd Service**: Creates service templates for automation

#### Key Features:

- ✅ **Multi-architecture support** (amd64, arm64, armv6l)
- ✅ **Security-focused** (dedicated service user, proper permissions)
- ✅ **Production-ready** (systemd integration, logging, monitoring)
- ✅ **User-friendly** (colored output, progress indicators, help system)

### 3. Build System Updates

#### Enhanced `cmd/manage-user/build.sh`

- **Docker environment detection** and guidance
- **Improved error messages** with specific instructions
- **Production deployment references**

#### Created `scripts/test-docker-go.sh`

- **Docker Go installation verification**
- **Build process testing**
- **Environment validation**

### 4. Documentation Updates

#### Updated `cmd/manage-user/README.md`

- **Docker-specific build instructions**
- **Production deployment guidance**
- **Environment setup documentation**

## 🚀 Usage

### Docker Development Environment

```bash
# Go is pre-installed in Docker
cd cmd/manage-user
./build.sh

# If Go is not in PATH:
source /etc/profile.d/go.sh
./build.sh

# Test the setup:
../../scripts/test-docker-go.sh
```

### Production Deployment

```bash
# One-command production setup:
sudo scripts/install-manage-user-prod.sh

# This creates:
# - /usr/local/bin/manage-user-tui (binary)
# - /usr/local/bin/manage-user (wrapper script)
# - /opt/idling/bin/manage-user-tui (service copy)
# - /opt/idling/config/manage-user.env (template)
# - /etc/systemd/system/manage-user@.service (service)
```

### Production Usage

```bash
# Configure database:
sudo cp /opt/idling/config/manage-user.env /opt/idling/config/manage-user.env.local
sudo nano /opt/idling/config/manage-user.env.local

# Run the tool:
manage-user                    # Interactive mode
manage-user 123               # Direct user lookup
sudo -u idling manage-user    # As service user (recommended)

# Service management:
systemctl start manage-user@123
systemctl status manage-user@123
```

## 🔒 Security Considerations

### Service User

- **Dedicated user**: `idling` user for running the service
- **Limited permissions**: No shell access, restricted home directory
- **Proper ownership**: All files owned by service user

### Configuration Security

- **Environment-based**: Database credentials in environment files
- **Restricted permissions**: Config files are 600 (owner read/write only)
- **Template system**: Prevents accidental credential exposure

### System Integration

- **Systemd service**: Proper process management and logging
- **Audit logging**: All executions logged with timestamps
- **Error handling**: Graceful failure modes

## 📊 Benefits

### For Development

- **Consistent environment**: Go available in all Docker containers
- **Easy setup**: No manual Go installation required
- **Testing tools**: Automated verification scripts

### For Production

- **Automated deployment**: One-script installation
- **Professional setup**: Service user, systemd integration
- **Monitoring ready**: Logging and service management
- **Security hardened**: Proper permissions and isolation

### For Operations

- **Easy maintenance**: Centralized configuration
- **Service management**: Standard systemd operations
- **Troubleshooting**: Comprehensive logging and debug modes
- **Scalability**: Template-based service instances

## 🔗 Related Files

- `Dockerfile` - Main Docker configuration with Go
- `scripts/install-manage-user-prod.sh` - Production installation
- `scripts/test-docker-go.sh` - Docker Go testing
- `cmd/manage-user/build.sh` - Enhanced build script
- `cmd/manage-user/README.md` - Updated documentation

## 📈 Next Steps

With this infrastructure in place, the User Management TUI is ready for:

1. **Development**: Immediate use in Docker environment
2. **Testing**: Comprehensive testing with provided scripts
3. **Production**: One-command deployment to production servers
4. **Documentation**: Ready for comprehensive Docusaurus documentation

---

_This infrastructure setup ensures the User Management TUI can be deployed consistently across development, staging, and production environments with minimal manual intervention._
