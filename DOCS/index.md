---
layout: default
title: Idling.app Documentation
description: Complete documentation for the Idling.app project - migrations, deployment, development guides and more
---

# 📚 Idling.app Documentation

Welcome to the comprehensive documentation for **Idling.app** - a modern social platform built with Next.js, PostgreSQL, and cutting-edge web technologies.

## 🚀 Quick Start

- **[Getting Started](./docs/getting-started/)** - Set up your development environment
- **[Database Setup](./database/migrations)** - Migration system and database management
- **[Rate Limiting](../src/lib/services/RateLimitService.md)** - Security and performance protection system
- **[Deployment Guide](./deployment)** - Production deployment instructions

## 📖 Documentation Sections

### 🔌 API Documentation

- **[Interactive Swagger UI](../src/app/api/swagger.md)** - Test and explore all API endpoints directly in your browser
- **[API Overview](../src/app/api/README.md)** - Introduction to the idling.app API structure
- **[Authentication Guide](./docs/getting-started/#authentication)** - How to authenticate with the API

### 🧩 Components

- **[Rich Input System](../src/components/rich-input-system/index.md)** - Comprehensive documentation for the intelligent text editing component
- **[Component Library](../src/components/index.md)** - Complete UI component documentation and patterns

### 🗄️ Database & Migrations

- **[Migration System Guide](./database/migrations)** - Complete migration system documentation
- **[Database Optimization](./database/optimization)** - Performance optimization strategies
- **[Massive Seed Data](./database/massive-seed)** - Generate test data for development

### 🔧 Development

- **[Smart Filters](./development/smart-filters)** - Advanced filtering system
- **[Cache Strategy](./development/caching)** - Production caching implementation
- **[CI/CD Tests](./development/testing)** - Continuous integration setup

### 🛡️ Security & Rate Limiting

- **[Rate Limiting System](../src/lib/services/RateLimitService.md)** - Comprehensive rate limiting and security documentation
- **[Security Architecture](./docs/architecture/security/)** - Overall security implementation and patterns
- **[Admin Rate Limiting](../src/app/api/admin/README.md)** - Administrative rate limiting controls
- **[API Rate Limits](../src/app/api/README.md#rate-limiting)** - API endpoint rate limiting details

### 🚀 Deployment & Operations

- **[Production Deployment](./deployment/production)** - Server deployment guide
- **[Cache Management](./deployment/cache-management)** - Cache disabling and management
- **[Release Process](./deployment/releases)** - Release notes and versioning

### 🧪 Testing

- **[CI Testing Pipeline](./testing/ci-tests)** - Continuous integration testing
- **[Testing Strategy](./testing/)** - Unit, integration, and E2E testing

### 🔧 Troubleshooting

- **[Application Issues](./troubleshooting/application-issues-fixes)** - Common problems and solutions
- **[Debug Guide](./troubleshooting/)** - Troubleshooting methodology

### 🏗️ Architecture

- **[System Architecture](./architecture/)** - High-level system design and patterns
- **[User Identification](./architecture/USER_IDENTIFICATION_ARCHITECTURE)** - Authentication system design

### 📦 Components

- **[Component Library](../src/components/)** - UI component documentation and patterns

### 📚 Libraries

- **[Internal Libraries](../src/lib/)** - Shared utilities and modules
- **[Services](../src/lib/services/)** - Core application services
- **[Utilities](../src/lib/utils/)** - Helper functions and utilities

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
2. **[Check Testing Guide](./development/testing)** - Ensure all tests pass
3. **[Review Migration Docs](./database/migrations)** - Understand database changes

## 📊 Project Status

- ✅ **Migration System**: Fully automated with rollback protection
- ✅ **Smart Filtering**: Advanced search with millions of records
- ✅ **Rate Limiting**: Comprehensive security and performance protection
- ✅ **Production Ready**: Deployed with comprehensive monitoring
- ✅ **Test Coverage**: E2E and unit tests with CI/CD

## 🔗 Quick Links

| Resource              | Description                      | Link                                            |
| --------------------- | -------------------------------- | ----------------------------------------------- |
| **Main README**       | Project overview and setup       | [View](./docs/getting-started/)                 |
| **API Documentation** | Interactive Swagger UI           | [View](../src/app/api/swagger.md)               |
| **Migration Guide**   | Database migration system        | [View](./database/migrations)                   |
| **Rate Limiting**     | Security and performance system  | [View](../src/lib/services/RateLimitService.md) |
| **Smart Filters**     | Advanced filtering documentation | [View](./development/smart-filters)             |
| **Production Guide**  | Deployment and operations        | [View](./deployment/production)                 |

---

_Last updated: {{ site.time | date: "%B %d, %Y" }}_

> **Need help?** Check our documentation sections above or reach out to the development team.
