---
layout: default
title: 'System Design'
description: 'Detailed system architecture and design patterns'
permalink: /architecture/system/
parent: Architecture
nav_order: 1
---

# 🏛️ System Design

Detailed system architecture and design patterns for Idling.app.

## 🎯 Architecture Overview

Idling.app follows a layered architecture pattern with clear separation of concerns.

```mermaid
graph TB
    subgraph "Presentation Layer"
        A[React Components]
        B[Next.js Pages]
        C[API Routes]
    end

    subgraph "Business Logic Layer"
        D[Services]
        E[Middleware]
        F[Utilities]
    end

    subgraph "Data Access Layer"
        G[Database Models]
        H[Query Builders]
        I[Migrations]
    end

    subgraph "Infrastructure Layer"
        J[PostgreSQL]
        K[Redis Cache]
        L[File Storage]
    end

    A --> D
    B --> E
    C --> F
    D --> G
    E --> H
    F --> I
    G --> J
    H --> K
    I --> L
```

## 🔧 Core Components

### Frontend Architecture

- **Next.js App Router**: Modern routing and layouts
- **React Server Components**: Server-side rendering
- **Client Components**: Interactive UI elements
- **API Routes**: Backend API endpoints

### Backend Services

- **Authentication Service**: User auth and sessions
- **User Management Service**: Profile and permissions
- **Content Service**: Rich text and media
- **Notification Service**: Real-time updates

### Data Layer

- **PostgreSQL**: Primary database
- **Redis**: Caching and sessions
- **File Storage**: Media and uploads

---

_This is a stub file. [Contribute to expand this documentation](/community/contributing/)._
