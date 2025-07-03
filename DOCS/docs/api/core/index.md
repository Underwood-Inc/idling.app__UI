---
layout: default
title: '📋 Core Endpoints'
description: 'Main application endpoints for Idling.app'
nav_order: 3
parent: '🔌 API Reference'
grand_parent: '📚 Documentation'
---

# 📋 Core Endpoints

Main application endpoints for user management, content, and core functionality.

## Authentication Endpoints

### POST /api/v1/auth/login

Authenticate user and receive access token.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

### POST /api/v1/auth/logout

Invalidate current session token.

### POST /api/v1/auth/refresh

Refresh expired access token.

## User Management

### GET /api/v1/users/me

Get current user profile information.

### PUT /api/v1/users/me

Update current user profile.

### DELETE /api/v1/users/me

Delete current user account.

## Content Endpoints

### GET /api/v1/content

List all content items with pagination.

**Query Parameters:**

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `search` - Search query
- `category` - Filter by category

### POST /api/v1/content

Create new content item.

### GET /api/v1/content/:id

Get specific content item by ID.

### PUT /api/v1/content/:id

Update existing content item.

### DELETE /api/v1/content/:id

Delete content item.

## File Upload

### POST /api/v1/upload

Upload files to the system.

**Headers:**

- `Content-Type: multipart/form-data`

**Form Data:**

- `file` - File to upload
- `category` - Upload category (optional)

## Search & Discovery

### GET /api/v1/search

Search across all content types.

**Query Parameters:**

- `q` - Search query (required)
- `type` - Content type filter
- `limit` - Results limit (default: 10)

### GET /api/v1/categories

List all available content categories.

## Error Responses

All endpoints may return these error responses:

- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

## Rate Limiting

- **Authenticated users**: 1000 requests per hour
- **Anonymous users**: 100 requests per hour
- **Upload endpoints**: 50 requests per hour

## Next Steps

- Try the [Interactive Tools](../interactive/) to test these endpoints
- Review [Admin Endpoints](../admin/) for administrative functions
- Check [API Overview](../overview/) for authentication details
