---
layout: default
title: '🔌 API Reference'
description: 'Complete API documentation for Idling.app'
nav_order: 2
parent: '📚 Documentation'
has_children: true
---

# 🔌 API Reference

Complete documentation for the Idling.app REST API. Our API provides programmatic access to all core functionality.

## Quick Navigation

### 📖 API Overview

Introduction to our API, authentication, and core concepts.
[View Overview →](overview/)

### 🧪 Interactive Tools

Test our API directly with Swagger UI and interactive documentation.
[Try Interactive Tools →](interactive/)

### 📋 Core Endpoints

Main application endpoints for user management, content, and core features.
[View Core Endpoints →](core/)

### 🔧 Admin Endpoints

Administrative endpoints for system management and configuration.
[View Admin Endpoints →](admin/)

## API Features

- **RESTful Design** - Clean, predictable URLs and HTTP methods
- **JSON API** - All requests and responses use JSON
- **Authentication** - Secure token-based authentication
- **Rate Limiting** - Built-in rate limiting for API stability
- **Versioning** - API versioning for backward compatibility

## Getting Started

1. **Authentication** - Get your API key from the dashboard
2. **Base URL** - All API requests use `https://api.idling.app/v1/`
3. **Headers** - Include `Authorization: Bearer YOUR_TOKEN`
4. **Testing** - Use our [Interactive Tools](interactive/) to test endpoints

## Response Format

All API responses follow a consistent format:

```json
{
  "status": "success",
  "data": { ... },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "version": "1.0.0"
  }
}
```

## Error Handling

Errors are returned with appropriate HTTP status codes and descriptive messages:

```json
{
  "status": "error",
  "error": {
    "code": 400,
    "message": "Validation failed",
    "details": { ... }
  }
}
```

## Need Help?

- Try our [Interactive Tools](interactive/) for hands-on testing
- Join our [Discord](../../community/communication/discord/) for API support
- Check [GitHub Issues](https://github.com/Underwood-Inc/idling.app__UI/issues) for known issues

---

Ready to start? Begin with the [API Overview](overview/) or jump into [Interactive Testing](interactive/)!
