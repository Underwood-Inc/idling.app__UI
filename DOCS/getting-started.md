---
layout: default
title: Getting Started
description: Complete setup guide for Idling.app development environment
---

# 🚀 Getting Started with Idling.app

This guide will help you set up your development environment for **Idling.app**, a modern social platform built with Next.js and PostgreSQL.

## 📊 Project Status

![React](https://img.shields.io/badge/React-19.0.0--alpha-61DAFB?style=flat&logo=react&logoColor=white)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Underwood-Inc_idling.app__UI&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=Underwood-Inc_idling.app__UI)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=Underwood-Inc_idling.app__UI&metric=bugs)](https://sonarcloud.io/summary/new_code?id=Underwood-Inc_idling.app__UI)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=Underwood-Inc_idling.app__UI&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=Underwood-Inc_idling.app__UI)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=Underwood-Inc_idling.app__UI&metric=coverage)](https://sonarcloud.io/summary/new_code?id=Underwood-Inc_idling.app__UI)

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 19, TypeScript
- **Backend**: Node.js, PostgreSQL
- **Testing**: Playwright (E2E), Jest (Unit)
- **CI/CD**: GitHub Actions
- **Deployment**: Docker, PM2
- **Code Quality**: SonarCloud, ESLint, Prettier

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** (LTS version recommended)
- **Yarn** package manager
- **Docker** (for containerized development)
- **PostgreSQL** (if not using Docker)
- **Git** for version control

## 🚀 Quick Start Options

Choose your preferred development environment:

### Option 1: Docker Development (Recommended)

**Advantages:**

- ✅ Isolated environment
- ✅ Consistent across all machines
- ✅ No local PostgreSQL setup required
- ✅ Easy database reset/seeding

**Setup:**

```bash
# Install Docker (Ubuntu example)
# See: https://docs.docker.com/engine/install/ubuntu/

# Clone the repository
git clone <repository-url>
cd idling.app__UI

# Start development environment
yarn dev:docker
# Choose option 1 to start containers
```

**Common Docker Commands:**

```bash
# Start containers
yarn dev:docker # → option 1

# Stop containers
yarn dev:docker # → option 2

# Reset database
yarn dev:docker # → option 3

# Attach to container for debugging
docker exec -it nextjs sh
```

### Option 2: Local Development

**Prerequisites:**

- Local PostgreSQL server running
- `.env.local` file configured

**Setup:**

```bash
# Clone repository
git clone <repository-url>
cd idling.app__UI

# Install dependencies
yarn install

# Setup environment file
cp .env.example .env.local
# Edit .env.local with your database credentials

# Start development server
yarn dev
```

## 🗄️ Database Setup

### Initialize Database

**With Docker:**

```bash
# Database is automatically initialized
# Check docker-postgres/init.sql for schema
```

**Without Docker:**

```bash
# Run initialization script
psql -U your_user -d your_database -f src/lib/scripts/000-init.sql
```

### Run Migrations

```bash
# Access migration tool
yarn migrations

# Choose option 1 to run all migrations
# See: Database Migration Guide for details
```

### Seed Test Data

```bash
# Generate massive test dataset (1M+ records)
yarn dev:seed

# This creates:
# - 5,000 unique users
# - 200,000 main posts
# - 800,000 replies
# - Realistic hashtags and content
```

## 🧪 Testing

### Run All Tests

```bash
# Unit tests (Jest)
yarn test

# E2E tests (Playwright)
yarn test:e2e

# Install Playwright browsers (first time)
npx playwright install
```

### Test in CI Environment

```bash
# Run tests like GitHub Actions
IS_CI=1 yarn test
IS_CI=1 yarn test:e2e
```

**CI Test Requirements:**

- **Jest (Unit/Integration)**: Required - must pass for PR approval
- **Playwright (E2E)**: Optional - provides feedback but won't block merging
- **Coverage**: Must meet SonarCloud quality gate thresholds

## 🏗️ Development Workflow

### 1. Code Style

This project uses **true BEM CSS** without preprocessors:

```css
/* ✅ Good - BEM with separate classes for props */
.button {
}
.button--primary {
}
.button.md {
} /* For size props */

/* ❌ Avoid - Don't use BEM modifiers for prop-based styles */
.button--md {
}
```

### 2. Git Workflow

```bash
# Follow commit conventions
git commit -m "feat: add user authentication"
# See: project/commits for full guidelines
```

### 3. Database Changes

```bash
# Create new migration
yarn migrations # → option 2
# Enter descriptive name
# Edit the generated .sql file
# Test migration with yarn migrations
```

## 🚨 Common Troubleshooting

### PostgreSQL Connection Issues

**Docker Environment:**

```bash
# Stop conflicting local PostgreSQL
sudo service postgresql stop

# Check container status
docker ps
```

**Local Environment:**

```bash
# Start PostgreSQL service
sudo service postgresql start

# Check connection
psql -U your_user -d your_database -c "SELECT 1;"
```

### Missing Tables/Relations

```bash
# Reset database (Docker)
yarn dev:docker # → option 3

# Reset database (Local)
# Drop existing tables and re-run init script
psql -U your_user -d your_database -f src/lib/scripts/000-init.sql
```

### Build Permission Errors

```bash
# NextJS build conflicts
rm -rf .next

# Docker permission issues
sudo usermod -aG docker $USER
# Then restart your machine
```

### Playwright Issues

```bash
# Install system dependencies
npx playwright install --with-deps

# Clear browser cache
rm -rf ~/.cache/playwright
```

## 🔗 Next Steps

Once your environment is set up:

1. **[Read Migration Guide](../database/migrations)** - Understand database management
2. **[Check Testing Guide](../development/testing)** - Learn our testing practices
3. **[Review Commit Guidelines](../project/commits)** - Follow our standards
4. **[Explore Smart Filters](../development/smart-filters)** - Advanced features

## 📚 Additional Resources

- **[Database Documentation](../database/)** - Migration system, optimization
- **[Development Guides](../development/)** - Testing, caching, smart filters
- **[Deployment Docs](../deployment/)** - Production deployment guide
- **[Project Standards](../project/)** - Commits, updates, and project standards

---

> **Need Help?** Check our [troubleshooting section](#-common-troubleshooting) or reach out to the development team.

_This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app)._
