---
title: 'Database Utilities'
description: 'Database connection, query helpers, and migration utilities'
sidebar_position: 4
---

# 🗄️ Database & Data Management

Comprehensive documentation for database schema, migrations, performance optimization, and data management strategies.

## 🔄 Migrations

**[Database Migrations](migrations/)** - Schema management and version control:

- Automated migration system with rollback protection
- Schema versioning and change tracking
- Safe deployment procedures
- Data migration strategies
- Migration testing and validation

## ⚡ Performance

**[Database Performance](performance/)** - Optimization strategies:

- Query optimization techniques
- Index management and analysis
- Connection pooling configuration
- Caching strategies
- Performance monitoring and alerting

## 🌱 Data Management

**[Data Management](data/)** - Data seeding and maintenance:

- Seed data generation for development
- Data import/export procedures
- Data validation and cleanup
- Backup and recovery strategies
- Data privacy and security

## 📊 Database Schema

### Core Tables

- **users**, **accounts**, **sessions** - NextAuth identity and profiles
- **user_subscriptions**, **subscription_plans** - Billing and entitlements
- **permissions**, **user_roles** - Admin access control
- **custom_emojis** - User-uploaded emoji assets

### Relationships

- Users link to OAuth **accounts** and active **sessions**
- Users have **subscriptions**, **roles**, and optional **custom_emojis**

## 🔧 Tools & Utilities

- **Migration Runner** - Execute and rollback migrations
- **Schema Analyzer** - Analyze database structure
- **Performance Monitor** - Track query performance
- **Data Seeder** - Generate test data

## 🚀 Quick Start

1. **[Set up migrations](migrations/)** - Initialize migration system
2. **[Optimize performance](performance/)** - Configure for production
3. **[Seed test data](data/)** - Generate development data

---

_Database documentation is continuously updated. Last updated: January 28, 2025_
