---
layout: default
title: 'Contributing Guide'
description: 'How to contribute to the Idling.app project'
permalink: /community/contributing/
parent: Community
nav_order: 1
---

# 🤝 Contributing Guide

Welcome to the Idling.app contributing guide! We're excited to have you contribute to our project.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and Yarn
- Docker and Docker Compose
- Git knowledge
- Basic TypeScript/React experience

### First Steps

1. Fork the repository
2. Clone your fork locally
3. Install dependencies: `yarn install`
4. Start development environment: `docker-compose up -d`
5. Run the application: `yarn dev`

## 📋 Guidelines

### Code Standards

- Follow TypeScript best practices
- Use ESLint and Prettier configurations
- Write meaningful commit messages using conventional commits
- Include tests for new features

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with appropriate tests
3. Update documentation as needed
4. Submit pull request with clear description
5. Address review feedback promptly

## 🔧 Development Setup

### Environment Configuration

```bash
# Copy environment template
cp .env.example .env.local

# Edit with your configuration
vim .env.local
```

### Development Workflow

```bash
# Start development
yarn dev

# Run tests
yarn test

# Lint code
yarn lint

# Format code
yarn format
```

---

_This is a stub file. [Contribute to expand this documentation](/community/contributing/)._
