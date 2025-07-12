---
layout: default
title: 'API Reference'
description: 'Complete API documentation and reference for Idling.app'
permalink: /api/
---

# 🔌 API Reference

Complete API documentation and reference for Idling.app.

## 🌐 Base URL

```
Development: http://localhost:3000/api
Production:  https://idling.app/api
```

## 🔐 Authentication

Idling.app uses NextAuth.js for authentication with multiple providers.

### Authentication Endpoints

| Method | Endpoint            | Description              |
| ------ | ------------------- | ------------------------ |
| GET    | `/api/auth/signin`  | Sign in page             |
| POST   | `/api/auth/signin`  | Sign in with credentials |
| GET    | `/api/auth/signout` | Sign out page            |
| POST   | `/api/auth/signout` | Sign out user            |
| GET    | `/api/auth/session` | Get current session      |

### Example Request

```bash
curl -X GET http://localhost:3000/api/auth/session \
  -H "Cookie: next-auth.session-token=..."
```

## 👥 User Management

### User Endpoints

| Method | Endpoint          | Description     |
| ------ | ----------------- | --------------- |
| GET    | `/api/users`      | List all users  |
| GET    | `/api/users/[id]` | Get user by ID  |
| POST   | `/api/users`      | Create new user |
| PUT    | `/api/users/[id]` | Update user     |
| DELETE | `/api/users/[id]` | Delete user     |

### User Schema

```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "emailVerified": "datetime",
  "image": "string",
  "profile_public": "boolean",
  "bio": "string",
  "location": "string",
  "created_at": "datetime",
  "last_login": "datetime",
  "login_count": "number"
}
```

## 📝 Posts & Content

### Post Endpoints

| Method | Endpoint          | Description     |
| ------ | ----------------- | --------------- |
| GET    | `/api/posts`      | List posts      |
| GET    | `/api/posts/[id]` | Get post by ID  |
| POST   | `/api/posts`      | Create new post |
| PUT    | `/api/posts/[id]` | Update post     |
| DELETE | `/api/posts/[id]` | Delete post     |

### Post Schema

```json
{
  "id": "string",
  "title": "string",
  "content": "string",
  "author_id": "string",
  "created_at": "datetime",
  "updated_at": "datetime",
  "published": "boolean",
  "tags": ["string"]
}
```

## 🔍 Search & Filtering

### Search Endpoints

| Method | Endpoint            | Description    |
| ------ | ------------------- | -------------- |
| GET    | `/api/search`       | Search content |
| GET    | `/api/search/users` | Search users   |
| GET    | `/api/search/posts` | Search posts   |

### Query Parameters

```bash
# Search with filters
GET /api/search?q=keyword&type=post&limit=10&offset=0

# Advanced filtering
GET /api/posts?author=user123&published=true&sort=created_at&order=desc
```

## 🏥 Health & Monitoring

### System Endpoints

| Method | Endpoint       | Description         |
| ------ | -------------- | ------------------- |
| GET    | `/api/health`  | System health check |
| GET    | `/api/version` | API version info    |
| GET    | `/api/metrics` | System metrics      |

### Health Check Response

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "1.0.0",
  "database": "connected",
  "uptime": "24h 30m 15s"
}
```

## 🔧 Admin Functions

### Admin Endpoints

| Method | Endpoint                      | Description           |
| ------ | ----------------------------- | --------------------- |
| GET    | `/api/admin/users`            | Admin user management |
| POST   | `/api/admin/users/[id]/ban`   | Ban user              |
| POST   | `/api/admin/users/[id]/unban` | Unban user            |
| GET    | `/api/admin/stats`            | System statistics     |

## 📊 Rate Limiting

All API endpoints are rate-limited to prevent abuse:

- **Authenticated users**: 1000 requests per hour
- **Unauthenticated users**: 100 requests per hour
- **Admin endpoints**: 500 requests per hour

### Rate Limit Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## 🚨 Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  }
}
```

### Common Error Codes

| Code               | Status | Description              |
| ------------------ | ------ | ------------------------ |
| `UNAUTHORIZED`     | 401    | Authentication required  |
| `FORBIDDEN`        | 403    | Insufficient permissions |
| `NOT_FOUND`        | 404    | Resource not found       |
| `VALIDATION_ERROR` | 422    | Invalid input data       |
| `RATE_LIMITED`     | 429    | Too many requests        |
| `SERVER_ERROR`     | 500    | Internal server error    |

## 📚 Interactive Documentation

- **Swagger UI**: [http://localhost:3000/api/swagger](http://localhost:3000/api/swagger)
- **OpenAPI Spec**: [http://localhost:3000/api/openapi](http://localhost:3000/api/openapi)

## 🔗 Related Resources

- [Authentication Guide](/api/auth/)
- [User Management](/api/users/)
- [Post Management](/api/posts/)
- [Development Guide](/development/)

---

_This is a stub file. [Contribute to expand this documentation](/community/contributing/)._
