---
layout: default
title: 'Quick Start'
description: 'Get Idling.app running in under 5 minutes'
permalink: /getting-started/quickstart/
parent: Getting Started
nav_order: 2
---

# 🏃 Quick Start Guide

Get Idling.app running in under 5 minutes with our streamlined setup.

## ⚡ One-Command Setup

```bash
# Clone, install, and start everything
git clone https://github.com/your-org/idling.app__UI.git && \
cd idling.app__UI && \
yarn install && \
docker-compose up -d && \
yarn dev
```

## 🎯 Essential Commands

```bash
# Development server
yarn dev

# Database operations
yarn migrate
yarn seed

# Testing
yarn test
yarn test:e2e

# Build
yarn build
```

## 🔗 Quick Links

Once running, access these URLs:

- **Main App**: [http://localhost:3000](http://localhost:3000)
- **API Docs**: [http://localhost:3000/api/swagger](http://localhost:3000/api/swagger)
- **Admin Panel**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Documentation**: [http://localhost:4000](http://localhost:4000)

## 🧪 Test Your Setup

```bash
# Health check
curl http://localhost:3000/api/health

# Create test user
yarn run manage-user create --email test@example.com --username testuser
```

## 📱 Mobile Development

```bash
# Expose to network for mobile testing
yarn dev --host 0.0.0.0
```

## 🔄 Reset Environment

```bash
# Complete reset
docker-compose down -v
yarn clean
yarn install
docker-compose up -d
yarn migrate
yarn seed
```

## 🚀 Next Steps

- [📖 Full Installation Guide](/getting-started/installation/)
- [🐳 Docker Setup Details](/getting-started/docker/)
- [🔌 API Documentation](/api/)
- [🛠️ Development Guide](/development/)

---

_This is a stub file. [Contribute to expand this documentation](/community/contributing/)._
