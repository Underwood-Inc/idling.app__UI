---
layout: default
title: 'API Reference'
description: 'Complete API documentation and interactive tools'
permalink: /docs/api/
---

# 🔌 API Reference

Complete API documentation for the Idling.app project, including interactive tools and comprehensive endpoint references.

## 📖 API Overview

Welcome to the Idling.app API! Our REST API provides programmatic access to all platform features with comprehensive rate limiting, authentication, and error handling.

### Base URL

```
https://api.idling.app
```

### API Version

Current version: **v1**

All API endpoints are prefixed with `/api/v1/`

## 🚀 Quick Start

### Authentication

All API requests require authentication using a Bearer token:

```bash
curl -X GET "https://api.idling.app/api/v1/user/profile" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Response Format

All responses follow a consistent JSON structure:

```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "version": "v1"
  }
}
```

## 🔧 Interactive Tools

### Swagger UI

Explore and test API endpoints directly in your browser:

**[Open Swagger UI →](swagger/)**

Features:

- Interactive endpoint testing
- Request/response examples
- Authentication testing
- Schema validation
- Real-time API exploration

### API Testing Tools

- **Postman Collection**: Import our complete API collection
- **OpenAPI Spec**: Download the OpenAPI 3.0 specification
- **SDK Examples**: Code examples in multiple languages

## 📚 Core Endpoints

### Authentication Endpoints

- **POST /api/v1/auth/login** - User authentication
- **POST /api/v1/auth/logout** - Session termination
- **POST /api/v1/auth/refresh** - Token refresh
- **GET /api/v1/auth/me** - Current user info

### User Management

- **GET /api/v1/user/profile** - Get user profile
- **PUT /api/v1/user/profile** - Update user profile
- **GET /api/v1/user/settings** - Get user settings
- **PUT /api/v1/user/settings** - Update user settings

### Content Endpoints

- **GET /api/v1/posts** - List posts
- **POST /api/v1/posts** - Create new post
- **GET /api/v1/posts/:id** - Get specific post
- **PUT /api/v1/posts/:id** - Update post
- **DELETE /api/v1/posts/:id** - Delete post

### Upload Endpoints

- **POST /api/v1/upload/image** - Upload image
- **POST /api/v1/upload/avatar** - Upload avatar
- **GET /api/v1/upload/signed-url** - Get signed upload URL

## 🔐 Administrative Endpoints

### Admin Authentication

Administrative endpoints require elevated permissions:

```bash
curl -X GET "https://api.idling.app/api/v1/admin/users" \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"
```

### Admin Endpoints

- **GET /api/v1/admin/users** - List all users
- **GET /api/v1/admin/posts** - List all posts
- **GET /api/v1/admin/analytics** - Platform analytics
- **POST /api/v1/admin/actions** - Administrative actions

**[View Admin Documentation →](admin/)**

## 🛡️ Rate Limiting

### Rate Limits

- **Authenticated Users**: 1000 requests per hour
- **Anonymous Users**: 100 requests per hour
- **Admin Users**: 5000 requests per hour

### Rate Limit Headers

All responses include rate limit information:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

### Rate Limit Exceeded

When rate limits are exceeded:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again later.",
    "retryAfter": 3600
  }
}
```

## 📝 Request/Response Examples

### Successful Response

```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "email",
        "message": "Valid email address required"
      }
    ]
  }
}
```

## 🚦 Status Codes

| Code | Status                | Description                   |
| ---- | --------------------- | ----------------------------- |
| 200  | OK                    | Request successful            |
| 201  | Created               | Resource created successfully |
| 400  | Bad Request           | Invalid request data          |
| 401  | Unauthorized          | Authentication required       |
| 403  | Forbidden             | Insufficient permissions      |
| 404  | Not Found             | Resource not found            |
| 429  | Too Many Requests     | Rate limit exceeded           |
| 500  | Internal Server Error | Server error                  |

## 📊 Pagination

List endpoints support pagination:

```bash
curl "https://api.idling.app/api/v1/posts?limit=20&offset=0"
```

### Pagination Response

```json
{
  "success": true,
  "data": [
    // Array of items
  ],
  "meta": {
    "pagination": {
      "total": 1000,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

## 🔍 Filtering and Sorting

### Filtering

```bash
curl "https://api.idling.app/api/v1/posts?status=published&author=user_123"
```

### Sorting

```bash
curl "https://api.idling.app/api/v1/posts?sort=created_at&order=desc"
```

## 🌐 CORS and Security

### CORS Policy

- **Allowed Origins**: Configured per environment
- **Allowed Methods**: GET, POST, PUT, DELETE, PATCH
- **Allowed Headers**: Authorization, Content-Type
- **Credentials**: Supported for authenticated requests

### Security Headers

All responses include security headers:

- **X-Content-Type-Options**: nosniff
- **X-Frame-Options**: DENY
- **X-XSS-Protection**: 1; mode=block
- **Strict-Transport-Security**: max-age=31536000

## 🧪 Testing

### Test Environment

Test API endpoints in our sandbox environment:

```
https://api-test.idling.app
```

### Test Data

- Use test API keys for development
- Test data is reset daily
- No rate limits in test environment

## 📚 SDKs and Libraries

### Official SDKs

- **JavaScript/TypeScript**: `@idling/api-client`
- **Python**: `idling-api-python`
- **PHP**: `idling-api-php`

### Community Libraries

- **Ruby**: `idling-ruby` (community maintained)
- **Go**: `go-idling` (community maintained)

## 🔗 Related Documentation

- **[Authentication Guide](../getting-started/#authentication)** - Detailed auth setup
- **[Rate Limiting](../../dev/libraries/services/#rate-limiting)** - Rate limiting implementation
- **[Security Architecture](../architecture/security/)** - Security patterns
- **[Admin Documentation](admin/)** - Administrative endpoints

## 📞 Support

### Getting Help

- **GitHub Issues**: Report bugs and request features
- **Discord**: Real-time community support
- **Email**: api-support@idling.app

### API Status

Check API status and uptime:

- **Status Page**: status.idling.app
- **Incident Reports**: Real-time incident updates

---

**Last Updated**: {{ site.time | date: "%B %d, %Y" }}
**API Version**: v1.0.0

> **Need help?** Join our [Discord community](../../community/communication/discord/) or check our [GitHub discussions](../../community/communication/github/) for API support.
