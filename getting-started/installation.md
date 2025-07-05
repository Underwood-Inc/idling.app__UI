---
layout: default
title: 'Installation Guide'
description: 'Detailed installation and setup instructions for Idling.app'
permalink: /getting-started/installation/
parent: Getting Started
nav_order: 1
---

# 🔧 Installation Guide

Detailed instructions for setting up Idling.app in different environments.

## 🖥️ Development Setup

### System Requirements

- **Node.js**: 18.0.0 or higher
- **Yarn**: Latest stable version
- **Docker**: 20.10.0 or higher
- **Docker Compose**: 2.0.0 or higher
- **Go**: 1.21.0 or higher (for CLI tools)

### Step-by-Step Installation

1. **Install Node.js and Yarn**

   ```bash
   # Using nvm (recommended)
   nvm install 18
   nvm use 18
   npm install -g yarn
   ```

2. **Install Docker**

   - [Docker Desktop](https://www.docker.com/products/docker-desktop) for Windows/Mac
   - [Docker Engine](https://docs.docker.com/engine/install/) for Linux

3. **Clone and Setup**

   ```bash
   git clone https://github.com/your-org/idling.app__UI.git
   cd idling.app__UI
   yarn install
   ```

4. **Environment Configuration**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

5. **Start Services**
   ```bash
   docker-compose up -d postgres
   yarn dev
   ```

## 🐳 Docker Installation

Complete Docker-based setup for isolated development.

```bash
# Build and start all services
docker-compose up --build

# Access the application
open http://localhost:3000
```

## 🔧 Manual Installation

For environments without Docker support.

### Database Setup

```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb idling
```

### Application Setup

```bash
# Install dependencies
yarn install

# Run migrations
yarn migrate

# Start development server
yarn dev
```

## ✅ Verification

Verify your installation:

```bash
# Check application
curl http://localhost:3000/api/version

# Check database
docker exec -it postgres psql -U postgres -d idling -c "SELECT version();"
```

## 🚨 Troubleshooting

Common installation issues and solutions:

### Port Conflicts

```bash
# Check what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Docker Issues

```bash
# Reset Docker environment
docker-compose down -v
docker-compose up --build
```

### Database Connection

```bash
# Check PostgreSQL status
docker-compose logs postgres
```

---

_This is a stub file. [Contribute to expand this documentation](/community/contributing/)._
