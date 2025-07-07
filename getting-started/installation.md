---
layout: default
title: 'Installation Guide'
description: 'Detailed installation instructions for Idling.app'
permalink: /getting-started/installation/
parent: Getting Started
---

# 📦 Installation Guide

Detailed step-by-step installation instructions for Idling.app.

## 🔧 System Requirements

- **Node.js**: 18.0.0 or higher
- **Yarn**: 1.22.0 or higher
- **Docker**: 20.10.0 or higher
- **Docker Compose**: 2.0.0 or higher
- **PostgreSQL**: 14.0 or higher (via Docker)
- **Go**: 1.21.0 or higher (for CLI tools)

## 🚀 Installation Steps

### 1. Clone Repository

```bash
git clone https://github.com/Underwood-Inc/idling.app__UI.git
cd idling.app__UI
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
yarn install

# Install Go dependencies (for CLI tools)
cd cmd/manage-user
go mod download
cd ../..
```

### 3. Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Edit environment variables
nano .env.local
```

### 4. Database Setup

```bash
# Start PostgreSQL container
docker-compose up -d postgres

# Run database migrations
yarn db:migrate

# Seed database (optional)
yarn db:seed
```

### 5. Start Development Server

```bash
# Start all services
docker-compose up -d

# Start Next.js development server
yarn dev
```

### 6. Verify Installation

- **Main App**: [http://localhost:3000](http://localhost:3000)
- **Documentation**: [http://localhost:4000](http://localhost:4000)
- **API Health**: [http://localhost:3000/api/health](http://localhost:3000/api/health)

## 🔧 CLI Tools Installation

```bash
# Install manage-user CLI tool
./scripts/install-manage-user-prod.sh

# Verify installation
manage-user --help
```

## 🆘 Troubleshooting

### Common Issues

1. **Port conflicts**: Change ports in `docker-compose.yml`
2. **Permission issues**: Run with `sudo` on Linux
3. **Database connection**: Check PostgreSQL container status

### Getting Help

- [Quick Start Guide](/getting-started/quickstart/)
- [Docker Setup](/getting-started/docker/)
- [Community Support](/community/)

---

_This is a stub file. [Contribute to expand this documentation](/community/contributing/)._
