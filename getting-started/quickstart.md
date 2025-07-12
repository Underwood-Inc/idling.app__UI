---
title: 'Quick Start'
description: 'Get up and running in minutes with essential setup steps'
sidebar_position: 3
---

# 🏃 Quick Start Guide

Get Idling.app up and running in 5 minutes.

## ⚡ Prerequisites

- [Docker](https://www.docker.com/get-started) installed
- [Node.js 18+](https://nodejs.org/) and [Yarn](https://yarnpkg.com/) installed
- [Git](https://git-scm.com/) installed

## 🚀 5-Minute Setup

### 1. Clone & Enter

```bash
git clone https://github.com/Underwood-Inc/idling.app__UI.git
cd idling.app__UI
```

### 2. Install Dependencies

```bash
yarn install
```

### 3. Start Everything

```bash
# Start all services (PostgreSQL, docs, etc.)
docker-compose up -d

# Start the main application
yarn dev
```

### 4. Open & Explore

- **🌐 Main App**: [http://localhost:3000](http://localhost:3000)
- **📚 Documentation**: [http://localhost:4000](http://localhost:4000)
- **🔍 API Health**: [http://localhost:3000/api/health](http://localhost:3000/api/health)

## 🎯 What's Running?

| Service     | Port | URL                                     | Description        |
| ----------- | ---- | --------------------------------------- | ------------------ |
| Next.js App | 3000 | [localhost:3000](http://localhost:3000) | Main application   |
| Jekyll Docs | 4000 | [localhost:4000](http://localhost:4000) | Documentation site |
| PostgreSQL  | 5432 | localhost:5432                          | Database           |
| Adminer     | 8080 | [localhost:8080](http://localhost:8080) | Database admin     |

## 🔧 Quick Commands

```bash
# Development
yarn dev              # Start Next.js dev server
yarn build            # Build for production
yarn start            # Start production server

# Database
yarn db:migrate       # Run database migrations
yarn db:seed          # Seed database with sample data
yarn db:reset         # Reset database

# Testing
yarn test             # Run unit tests
yarn test:e2e         # Run end-to-end tests
yarn test:watch       # Run tests in watch mode

# Docker
docker-compose up -d  # Start all services
docker-compose down   # Stop all services
docker-compose logs   # View logs
```

## 🎨 First Steps

1. **Explore the App**: Visit [localhost:3000](http://localhost:3000)
2. **Read the Docs**: Check [localhost:4000](http://localhost:4000)
3. **Check the API**: Test [localhost:3000/api/health](http://localhost:3000/api/health)
4. **View Database**: Access [localhost:8080](http://localhost:8080) (user: `postgres`, password: `postgres`)

## 🔍 What's Next?

- [📦 Full Installation Guide](/getting-started/installation/) - Detailed setup
- [🐳 Docker Setup](/getting-started/docker/) - Container configuration
- [🛠️ Development Guide](/development/) - Start contributing
- [🏗️ Architecture](/architecture/) - Understand the system

## 🆘 Having Issues?

### Common Problems

1. **Port already in use**: Change ports in `docker-compose.yml`
2. **Docker not running**: Start Docker Desktop
3. **Permission denied**: Run with `sudo` on Linux

### Get Help

- [Installation Guide](/getting-started/installation/)
- [Community Support](/community/)
- [GitHub Issues](https://github.com/Underwood-Inc/idling.app__UI/issues)

---

**This documentation is under development. [Contribute to expand this documentation](/community/contributing/).**
