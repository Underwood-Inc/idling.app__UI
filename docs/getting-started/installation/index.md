---
layout: default
title: 'Installation Guide'
description: 'Complete installation and setup guide for Idling.app development environment'
permalink: /docs/getting-started/installation/
---

# 🔧 Installation Guide

Complete guide to setting up your Idling.app development environment.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (LTS version recommended)
- **Yarn** package manager
- **Docker** (for containerized development)
- **PostgreSQL** (if not using Docker)
- **Git** for version control

## Quick Installation

### Option 1: Docker Development (Recommended)

```bash
# Clone the repository
git clone https://github.com/Underwood-Inc/idling.app__UI.git
cd idling.app__UI

# Start the development environment
docker-compose up -d

# Install dependencies
yarn install

# Run database migrations
yarn db:migrate

# Start the development server
yarn dev
```

### Option 2: Local Development

```bash
# Clone the repository
git clone https://github.com/Underwood-Inc/idling.app__UI.git
cd idling.app__UI

# Install dependencies
yarn install

# Set up environment variables
cp .env.example .env

# Configure your database connection in .env
# POSTGRES_HOST=localhost
# POSTGRES_PORT=5432
# POSTGRES_USER=your_username
# POSTGRES_DB=idling_app
# POSTGRES_PASSWORD=your_password

# Run database migrations
yarn db:migrate

# Start the development server
yarn dev
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=your_username
POSTGRES_DB=idling_app
POSTGRES_PASSWORD=your_password

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Development Settings
NODE_ENV=development
PORT=3000
```

## Database Setup

### Using Docker

The Docker setup automatically configures PostgreSQL. No additional setup required.

### Local PostgreSQL

1. Install PostgreSQL on your system
2. Create a new database:
   ```sql
   CREATE DATABASE idling_app;
   ```
3. Run the initialization script:
   ```bash
   psql -d idling_app -f src/lib/scripts/000-init.sql
   ```

## Verification

After installation, verify your setup:

1. **Application**: Visit `http://localhost:3000`
2. **API**: Visit `http://localhost:3000/api/swagger`
3. **Database**: Check connection with `yarn db:status`

## Troubleshooting

### Common Issues

**Port Already in Use**

```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9
```

**Database Connection Issues**

```bash
# Check PostgreSQL service
sudo systemctl status postgresql

# Test database connection
psql -h localhost -U your_username -d idling_app
```

**Node Module Issues**

```bash
# Clean install
rm -rf node_modules yarn.lock
yarn install
```

## Next Steps

Once installation is complete:

1. 📖 Read the [Quick Start Guide](../quickstart/)
2. 🐳 Set up [Docker Development](../docker/)
3. 🏗️ Learn about the [Architecture](../../architecture/)
4. 🧪 Run the [Test Suite](../../../dev/testing/)

## Need Help?

- 💬 [Join our Discord](https://discord.gg/idling-app)
- 🐙 [GitHub Discussions](https://github.com/Underwood-Inc/idling.app__UI/discussions)
- 📧 [Create an Issue](https://github.com/Underwood-Inc/idling.app__UI/issues)
