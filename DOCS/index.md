---
layout: default
title: Idling.app Documentation
description: Complete documentation for the Idling.app project - migrations, deployment, development guides and more
---

# 📚 Idling.app Documentation

Welcome to the comprehensive documentation for **Idling.app** - a modern social platform built with Next.js, PostgreSQL, and cutting-edge web technologies.

## 🚀 Quick Start

- **[Getting Started](./docs/getting-started/)** - Set up your development environment
- **[Database Setup](./dev/database/)** - Migration system and database management
- **[Rate Limiting](./dev/libraries/services/#rate-limiting-service)** - Security and performance protection system
- **[Deployment Guide](./docs/deployment/)** - Production deployment instructions

## 📖 Documentation Sections

### 🔌 API Documentation

- **[Interactive Swagger UI](./docs/api/swagger/)** - Test and explore all API endpoints directly in your browser
- **[API Overview](./docs/api/)** - Introduction to the idling.app API structure
- **[Authentication Guide](./docs/getting-started/#authentication)** - How to authenticate with the API

### 🧩 Components

- **[Rich Input System](./dev/components/#rich-input-system)** - Comprehensive documentation for the intelligent text editing component
- **[Component Library](./dev/components/)** - Complete UI component documentation and patterns

### 🗄️ Database & Migrations

- **[Migration System Guide](./dev/database/)** - Complete migration system documentation
- **[Database Performance](./dev/database/performance/)** - Performance optimization strategies
- **[Data Management](./dev/database/data/)** - Data seeding and management

### 🔧 Development

- **[Development Environment](./dev/)** - Complete development documentation
- **[Testing Strategies](./dev/testing/)** - Unit, integration, and E2E testing
- **[Development Tools](./dev/tools/)** - Development environment and tools

### 🛡️ Security & Rate Limiting

- **[Rate Limiting System](./dev/libraries/services/#rate-limiting-service)** - Comprehensive rate limiting and security documentation
- **[Security Architecture](./docs/architecture/security/)** - Overall security implementation and patterns
- **[Admin Rate Limiting](./docs/api/admin/)** - Administrative rate limiting controls
- **[API Rate Limits](./docs/api/#rate-limiting)** - API endpoint rate limiting details

### 🚀 Deployment & Operations

- **[Production Deployment](./docs/deployment/production/)** - Server deployment guide
- **[Documentation Site](./docs/deployment/docs/)** - Deploy this documentation site
- **[Release Process](./docs/deployment/releases/)** - Release notes and versioning

### 🧪 Testing

- **[Testing Strategies](./dev/testing/)** - Complete testing documentation
- **[Unit Testing](./dev/testing/unit/)** - Unit test strategies
- **[E2E Testing](./dev/testing/e2e/)** - End-to-end testing with Playwright
- **[CI/CD Pipeline](./dev/testing/ci-cd/)** - Continuous integration setup

### 🔧 Troubleshooting

- **[Development Issues](./dev/tools/debugging/)** - Debugging and troubleshooting
- **[Performance Issues](./docs/architecture/performance/)** - Performance optimization

### 🏗️ Architecture

- **[System Architecture](./docs/architecture/)** - High-level system design and patterns
- **[System Design](./docs/architecture/system/)** - Detailed system architecture
- **[Security Architecture](./docs/architecture/security/)** - Security implementation patterns
- **[Performance Architecture](./docs/architecture/performance/)** - Performance optimization strategies

### 📦 Components

- **[Component Library](./dev/components/)** - UI component documentation and patterns
- **[Component Development](./dev/components/)** - Component development guidelines

### 📚 Libraries

- **[Internal Libraries](./dev/libraries/)** - Shared utilities and modules
- **[Core Services](./dev/libraries/services/)** - Core application services
- **[Utilities](./dev/libraries/utils/)** - Helper functions and utilities
- **[React Hooks](./dev/libraries/hooks/)** - Custom React hooks

### 📋 Templates

- **[Project Templates](./templates/)** - Standardized document formats
- **[Pull Request Template](./templates/pull_request_template)** - PR description format

### 📝 Project Management

- **[Commit Guidelines](./project/commits)** - Git commit standards
- **[Recent Updates](./project/updates)** - Latest project updates

### 📊 Reports

- **[Development Reports](./reports/)** - Feature debriefs and project analysis
- **[Demo Feature Debrief](./reports/demo-feature-debrief)** - Implementation analysis

### 🔧 Scripts

- **[Development Scripts](./scripts/)** - Automation tools and build utilities
- **[CLI Enhancements](./scripts/CLI_ENHANCEMENTS)** - Command-line improvements
- **[Version Management](./scripts/VERSION_BUMPING)** - Automated version control

## 🛠️ Technical Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Backend**: Node.js, PostgreSQL, Prisma
- **Security**: Advanced rate limiting with progressive penalties
- **Testing**: Playwright, Jest
- **Deployment**: Docker, PM2, GitHub Actions
- **Monitoring**: SonarQube, Custom analytics

## 🤝 Contributing

This project follows strict development standards:

1. **[Read Commit Guidelines](./project/commits)** - Follow our commit message format
2. **[Check Testing Guide](./dev/testing/)** - Ensure all tests pass
3. **[Review Migration Docs](./dev/database/)** - Understand database changes

## 📊 Project Status

- ✅ **Migration System**: Fully automated with rollback protection
- ✅ **Smart Filtering**: Advanced search with millions of records
- ✅ **Rate Limiting**: Comprehensive security and performance protection
- ✅ **Production Ready**: Deployed with comprehensive monitoring
- ✅ **Test Coverage**: E2E and unit tests with CI/CD

## 🔗 Quick Links

| Resource              | Description                     | Link                                                    |
| --------------------- | ------------------------------- | ------------------------------------------------------- |
| **Main README**       | Project overview and setup      | [View](./docs/getting-started/)                         |
| **API Documentation** | Interactive Swagger UI          | [View](./docs/api/swagger/)                             |
| **Migration Guide**   | Database migration system       | [View](./dev/database/)                                 |
| **Rate Limiting**     | Security and performance system | [View](./dev/libraries/services/#rate-limiting-service) |
| **Development Guide** | Complete development docs       | [View](./dev/)                                          |
| **Production Guide**  | Deployment and operations       | [View](./docs/deployment/)                              |

---

_Last updated: {{ site.time | date: "%B %d, %Y" }}_

> **Need help?** Check our documentation sections above or reach out to the development team.
