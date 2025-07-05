---
layout: default
title: 'System Architecture Overview'
description: 'Complete system architecture showing all layers and component relationships'
---

# 🏛️ System Architecture Overview

This diagram shows the complete system architecture of Idling.app, including all layers from user interface to database storage.

```mermaid
graph TB
    %% External Layer
    subgraph "🌐 External Layer"
        Users[👥 Users]
        CDN[🌍 CDN/Cloudflare]
        OAuth[🔐 OAuth Providers<br/>Twitch, Google]
    end

    %% Presentation Layer
    subgraph "🎨 Presentation Layer"
        Browser[🌐 Browser]
        PWA[📱 PWA Features]
        SW[⚙️ Service Worker]
    end

    %% Application Layer
    subgraph "🚀 Application Layer - Next.js 14"
        subgraph "Client Side"
            React[⚛️ React Components]
            Hooks[🎣 Custom Hooks]
            Context[🔄 Context Providers]
            State[📊 State Management<br/>Jotai + Zustand]
        end

        subgraph "Server Side"
            SSR[🖥️ SSR/SSG]
            API[🔌 API Routes]
            Middleware[🛡️ Middleware]
            Actions[⚡ Server Actions]
        end
    end

    %% Business Logic Layer
    subgraph "🧠 Business Logic Layer"
        Auth[🔐 Authentication<br/>NextAuth.js]
        Permissions[👮 Permissions<br/>RBAC System]
        Services[🔧 Business Services]
        Utils[🛠️ Utilities]
    end

    %% Data Access Layer
    subgraph "💾 Data Access Layer"
        ORM[🗃️ SQL Queries<br/>Direct PostgreSQL]
        Cache[⚡ Redis Cache]
        Files[📁 File Storage]
        Sessions[🎫 Session Store]
    end

    %% Infrastructure Layer
    subgraph "🏗️ Infrastructure Layer"
        DB[(🐘 PostgreSQL<br/>Primary Database)]
        Redis[(🔴 Redis<br/>Cache & Sessions)]
        Storage[💽 File System<br/>Images & Assets]
        Logs[📝 Logging System]
    end

    %% External Services
    subgraph "🌍 External Services"
        Analytics[📊 Analytics]
        Monitoring[📈 Monitoring]
        Email[📧 Email Service]
    end

    %% Connections
    Users --> Browser
    Users --> PWA
    Browser --> CDN
    CDN --> React

    React --> Hooks
    React --> Context
    Context --> State
    Hooks --> API

    Browser --> SW
    SW --> Cache

    API --> Auth
    API --> Middleware
    API --> Actions
    Auth --> OAuth

    Middleware --> Permissions
    Actions --> Services
    Services --> Utils

    Services --> ORM
    Services --> Cache
    Services --> Files
    Services --> Sessions

    ORM --> DB
    Cache --> Redis
    Files --> Storage
    Sessions --> Redis

    Services --> Analytics
    Services --> Monitoring
    Services --> Email

    DB --> Logs
    Redis --> Logs

    %% Styling
    classDef external fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef presentation fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef application fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef business fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef data fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef infrastructure fill:#f1f8e9,stroke:#33691e,stroke-width:2px
    classDef services fill:#e0f2f1,stroke:#004d40,stroke-width:2px

    class Users,CDN,OAuth external
    class Browser,PWA,SW presentation
    class React,Hooks,Context,State,SSR,API,Middleware,Actions application
    class Auth,Permissions,Services,Utils business
    class ORM,Cache,Files,Sessions data
    class DB,Redis,Storage,Logs infrastructure
    class Analytics,Monitoring,Email services
```

## 🏗️ Architecture Principles

### 🎯 Design Patterns

- **Repository Pattern**: Data access abstraction through direct SQL
- **Service Layer**: Business logic encapsulation
- **Factory Pattern**: Service instantiation
- **Observer Pattern**: Event-driven updates
- **Middleware Pattern**: Request/response processing

### 🔄 Data Flow

1. **Request**: User interaction → Browser → CDN → Next.js
2. **Processing**: Middleware → Authentication → Business Logic
3. **Data Access**: Services → ORM → Database
4. **Response**: Data → Serialization → Client → UI Update

### 🚀 Scalability Features

- **Horizontal Scaling**: Load balancing, CDN distribution
- **Caching Strategy**: Multi-layer caching (Browser, CDN, Redis, Application)
- **Database Optimization**: Connection pooling, read replicas
- **Performance Monitoring**: Real-time metrics and alerting

### 🔐 Security Layers

- **Authentication**: OAuth providers, JWT tokens, session management
- **Authorization**: Role-based access control (RBAC)
- **Data Protection**: Input validation, SQL injection prevention
- **Infrastructure**: HTTPS, security headers, rate limiting
