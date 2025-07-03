# 🔌 idling.app API Documentation

Welcome to the idling.app API documentation. This directory contains all API endpoints and their documentation.

## 📖 Quick Links

- **[Interactive Swagger UI](./swagger.md)** - Interactive API documentation
- **[OpenAPI Specification](./openapi.json)** - Machine-readable API specification
- **[Authentication Guide](../../DOCS/getting-started.md#authentication)** - How to authenticate with the API
- **[Rate Limiting](../lib/services/RateLimitService.md)** - API rate limiting documentation
- **[Development Setup](../../DOCS/getting-started.md)** - Set up your development environment

## 🚀 API Endpoints

### Core Endpoints

- **[/api/version](./version/)** - API version information
- **[/api/emojis](./emojis/)** - Emoji management and retrieval
- **[/api/upload](./upload/)** - File upload endpoints
- **[/api/profile](./profile/)** - User profile management

### Authentication

- **[/api/auth](./auth/)** - Authentication endpoints (NextAuth.js)
- **[/api/user](./user/)** - User account management

### Admin Endpoints

- **[/api/admin](./admin/)** - Administrative functions
  - User management
  - System monitoring
  - Rate limit management

### Utilities

- **[/api/alerts](./alerts/)** - System alerts and notifications
- **[/api/link-preview](./link-preview/)** - URL preview generation
- **[/api/og-image](./og-image/)** - Open Graph image generation

### Real-time

- **[/api/simple-sse](./simple-sse/)** - Server-sent events
- **[/api/test-sse](./test-sse/)** - SSE testing endpoints

## 🔧 Development

### Testing Endpoints

- **[/api/test](./test/)** - Development and testing utilities
- **[/api/debug](./debug/)** - Debug information endpoints

### Rate Limiting

All API endpoints are protected by a comprehensive rate limiting system:

- **Standard API**: 100 requests per minute
- **Authentication**: 500 requests per minute
- **File Uploads**: 5 requests per minute
- **Search/Filter**: 200 requests per minute
- **Admin Actions**: 50 requests per minute

See the [RateLimitService documentation](../lib/services/RateLimitService.md) for complete details.

### Error Handling

All API endpoints return standardized error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional details if available"
}
```

### Response Format

Successful responses follow this structure:

```json
{
  "success": true,
  "data": "Response data",
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "requestId": "unique-request-id"
  }
}
```

## 📊 Interactive Documentation

Visit the [Swagger UI](./swagger.md) for interactive API documentation where you can:

- Explore all endpoints
- Test API calls directly
- View request/response schemas
- Understand authentication requirements

## 🔐 Authentication

Most endpoints require authentication. See the [Authentication Guide](../../DOCS/getting-started.md#authentication) for details on:

- Session-based authentication
- API key usage
- Permission levels
- Admin access requirements

---

_This documentation is co-located with the API source code for better maintainability._
