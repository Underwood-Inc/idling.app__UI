---
layout: default
title: 'Quick Start Guide'
description: 'Get up and running with Idling.app in minutes'
permalink: /docs/getting-started/quickstart/
---

# 🚀 Quick Start Guide

Get up and running with Idling.app in under 5 minutes!

## 🎯 Prerequisites

- Node.js (LTS version)
- Yarn package manager
- Docker (recommended)

## ⚡ 1-Minute Setup

```bash
# Clone and enter the project
git clone https://github.com/Underwood-Inc/idling.app__UI.git
cd idling.app__UI

# Quick Docker setup
docker-compose up -d && yarn install && yarn dev
```

That's it! Your app should be running at `http://localhost:3000` 🎉

## 📋 Step-by-Step Guide

### 1. Clone the Repository

```bash
git clone https://github.com/Underwood-Inc/idling.app__UI.git
cd idling.app__UI
```

### 2. Start Services

```bash
# Start PostgreSQL and other services
docker-compose up -d
```

### 3. Install Dependencies

```bash
# Install all project dependencies
yarn install
```

### 4. Set Up Environment

```bash
# Copy environment template
cp .env.example .env

# The defaults work with Docker setup
# No changes needed for quick start!
```

### 5. Initialize Database

```bash
# Run database migrations
yarn db:migrate

# (Optional) Seed with sample data
yarn db:seed
```

### 6. Start Development Server

```bash
# Start the Next.js development server
yarn dev
```

## 🔗 Quick Links

After setup, visit these URLs:

- **🏠 Main App**: [http://localhost:3000](http://localhost:3000)
- **📚 API Docs**: [http://localhost:3000/api/swagger](http://localhost:3000/api/swagger)
- **🗄️ Database**: `localhost:5432` (if using local PostgreSQL)

## 🧪 Verify Your Setup

Run these commands to ensure everything is working:

```bash
# Check application health
curl http://localhost:3000/api/health

# Run tests
yarn test

# Check database connection
yarn db:status
```

## 🎨 First Steps

### Create Your First Post

1. Navigate to the app at `http://localhost:3000`
2. Sign up or log in
3. Create your first post
4. Explore the rich text editor features

### Explore the API

1. Visit the Swagger UI at `/api/swagger`
2. Try out the interactive API documentation
3. Test different endpoints

### Check Out the Code

Key files to explore:

- `src/app/page.tsx` - Main homepage
- `src/app/api/` - API routes
- `src/components/` - React components
- `src/lib/` - Utility functions and services

## 🚀 Next Steps

Now that you're up and running:

1. 📖 Read the [Installation Guide](../installation/) for detailed setup
2. 🐳 Learn about [Docker Development](../docker/)
3. 🏗️ Understand the [Architecture](../../architecture/)
4. 🧩 Explore [Components](../../../../src/components/)
5. 🧪 Set up [Testing](../../../dev/testing/)

## 🔧 Common Commands

```bash
# Development
yarn dev              # Start development server
yarn build            # Build for production
yarn start            # Start production server

# Database
yarn db:migrate       # Run database migrations
yarn db:seed          # Seed database with sample data
yarn db:reset         # Reset database (careful!)

# Testing
yarn test             # Run unit tests
yarn test:e2e         # Run end-to-end tests
yarn test:coverage    # Run tests with coverage

# Code Quality
yarn lint             # Run ESLint
yarn format           # Format code with Prettier
yarn type-check       # Run TypeScript checks
```

## 💡 Pro Tips

- **Hot Reload**: Changes to your code will automatically reload the browser
- **API Development**: Use the Swagger UI for testing API endpoints
- **Database Changes**: Always create migrations for schema changes
- **Environment Variables**: Use `.env.local` for local overrides

## 🆘 Need Help?

**Something not working?**

1. Check the [Troubleshooting Guide](../installation/#troubleshooting)
2. Look at [GitHub Issues](https://github.com/Underwood-Inc/idling.app__UI/issues)
3. Ask on [Discord](https://discord.gg/idling-app)
4. Create a [GitHub Discussion](https://github.com/Underwood-Inc/idling.app__UI/discussions)

**Want to contribute?**

1. Read the [Contributing Guide](../../../community/contributing/)
2. Check out [Development Standards](../../../community/standards/)
3. Join our [Discord Community](../../../community/communication/discord/)

---

Welcome to the Idling.app community! 🎉
