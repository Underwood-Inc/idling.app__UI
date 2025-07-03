---
layout: default
title: 'API Overview'
description: 'Introduction to the Idling.app REST API'
permalink: /docs/api/overview/
---

# 📖 API Overview

Welcome to the Idling.app REST API! This powerful API provides programmatic access to all platform features.

## 🚀 Getting Started

### Base URL

```
https://api.idling.app/v1
```

For development:

```
http://localhost:3000/api
```

### Authentication

All API requests require authentication using Bearer tokens:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.idling.app/v1/posts
```

### Rate Limiting

- **Authenticated**: 1000 requests per hour
- **Unauthenticated**: 100 requests per hour

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## 📊 API Versioning

We use URL versioning to ensure backward compatibility:

- **Current**: `/v1/` (recommended)
- **Legacy**: `/v0/` (deprecated)

### Version Headers

```bash
# Specify version via header
curl -H "API-Version: v1" \
     https://api.idling.app/posts
```

## 🔄 Request/Response Format

### Content Type

All requests and responses use JSON:

```bash
curl -H "Content-Type: application/json" \
     -H "Accept: application/json" \
     https://api.idling.app/v1/posts
```

### Standard Response Format

```json
{
  "success": true,
  "data": {
    "id": 123,
    "title": "Example Post",
    "content": "Post content..."
  },
  "meta": {
    "timestamp": "2023-12-01T10:00:00Z",
    "version": "v1"
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "title",
      "issue": "Title is required"
    }
  },
  "meta": {
    "timestamp": "2023-12-01T10:00:00Z",
    "version": "v1"
  }
}
```

## 🔍 Common Parameters

### Pagination

```bash
# Get page 2 with 20 items per page
curl "https://api.idling.app/v1/posts?page=2&limit=20"
```

Response includes pagination metadata:

```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "has_next": true,
    "has_prev": true
  }
}
```

### Filtering

```bash
# Filter by status and category
curl "https://api.idling.app/v1/posts?status=published&category=tech"
```

### Sorting

```bash
# Sort by creation date (descending)
curl "https://api.idling.app/v1/posts?sort=-created_at"

# Multiple sort fields
curl "https://api.idling.app/v1/posts?sort=-created_at,title"
```

### Field Selection

```bash
# Only return specific fields
curl "https://api.idling.app/v1/posts?fields=id,title,created_at"
```

## 🛡️ Security

### HTTPS Only

All API requests must use HTTPS. HTTP requests are automatically redirected.

### CORS Support

CORS is enabled for web applications:

```javascript
// Allowed origins
const allowedOrigins = [
  'https://idling.app',
  'https://app.idling.app',
  'http://localhost:3000'
];
```

### Request Validation

All inputs are validated and sanitized:

- **SQL Injection**: Parameterized queries
- **XSS**: Input sanitization
- **CSRF**: Token validation
- **Rate Limiting**: Request throttling

## 📈 Status Codes

| Code | Meaning               | Description             |
| ---- | --------------------- | ----------------------- |
| 200  | OK                    | Request successful      |
| 201  | Created               | Resource created        |
| 400  | Bad Request           | Invalid request         |
| 401  | Unauthorized          | Authentication required |
| 403  | Forbidden             | Permission denied       |
| 404  | Not Found             | Resource not found      |
| 429  | Too Many Requests     | Rate limit exceeded     |
| 500  | Internal Server Error | Server error            |

## 🔧 Core Resources

### Posts

- `GET /posts` - List posts
- `POST /posts` - Create post
- `GET /posts/{id}` - Get post
- `PUT /posts/{id}` - Update post
- `DELETE /posts/{id}` - Delete post

### Users

- `GET /users` - List users
- `POST /users` - Create user
- `GET /users/{id}` - Get user
- `PUT /users/{id}` - Update user

### Categories

- `GET /categories` - List categories
- `POST /categories` - Create category
- `GET /categories/{id}` - Get category

### Comments

- `GET /posts/{id}/comments` - List comments
- `POST /posts/{id}/comments` - Create comment
- `PUT /comments/{id}` - Update comment
- `DELETE /comments/{id}` - Delete comment

## 🧪 Testing the API

### Interactive Documentation

Visit our Swagger UI for interactive API testing:

- **Production**: [https://api.idling.app/docs](https://api.idling.app/docs)
- **Development**: [http://localhost:3000/api/swagger](http://localhost:3000/api/swagger)

### Example Requests

```bash
# Get all posts
curl https://api.idling.app/v1/posts

# Create a new post
curl -X POST https://api.idling.app/v1/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "My New Post",
    "content": "This is the post content",
    "category_id": 1
  }'

# Update a post
curl -X PUT https://api.idling.app/v1/posts/123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Updated Post Title"
  }'
```

## 🔗 SDKs and Libraries

### Official SDKs

- **JavaScript/TypeScript**: `@idling/api-client`
- **Python**: `idling-api-python`
- **PHP**: `idling/api-client`

### Installation

```bash
# JavaScript/TypeScript
npm install @idling/api-client

# Python
pip install idling-api-python

# PHP
composer require idling/api-client
```

### Usage Example

```javascript
import { IdlingAPI } from '@idling/api-client';

const api = new IdlingAPI({
  baseURL: 'https://api.idling.app/v1',
  token: 'YOUR_TOKEN'
});

// Get posts
const posts = await api.posts.list();

// Create post
const newPost = await api.posts.create({
  title: 'My New Post',
  content: 'Post content...'
});
```

## 📚 Next Steps

1. 🧪 Try the [Interactive Tools](../interactive/)
2. 📋 Explore [Core Endpoints](../core/)
3. 🔧 Check [Admin Endpoints](../admin/)
4. 🏗️ Learn about [Architecture](../../architecture/)

## 💡 Best Practices

- **Cache responses** when possible
- **Use pagination** for large datasets
- **Handle rate limits** gracefully
- **Validate inputs** before sending
- **Use HTTPS** always
- **Store tokens** securely

## 🆘 Need Help?

- 📚 [API Documentation](../interactive/)
- 💬 [Discord Community](https://discord.gg/idling-app)
- 🐙 [GitHub Issues](https://github.com/Underwood-Inc/idling.app__UI/issues)
- 📧 [Contact Support](mailto:support@idling.app)

---

Ready to build something amazing? 🚀
