# 📋 API Endpoint Template

Use this template when documenting API endpoints for the Idling.app project.

## 📝 Template Instructions

1. **Copy this template** to your API documentation location
2. **Replace placeholders** with your specific information
3. **Delete this instruction section** before publishing
4. **Follow the structure** provided below

---

# [Endpoint Name] API

Brief description of the API endpoint and its purpose.

## 🎯 Overview

### Purpose

Explain what this endpoint does and why it exists.

### Key Features

- **Feature 1**: Description of the first key feature
- **Feature 2**: Description of the second key feature
- **Feature 3**: Description of the third key feature

## 📍 Endpoint Details

### Base URL

```
https://api.idling.app
```

### Endpoint Path

```
[METHOD] /api/v1/[endpoint-path]
```

### Full URL

```
[METHOD] https://api.idling.app/api/v1/[endpoint-path]
```

## 🔐 Authentication

### Required Authentication

- **Type**: Bearer Token (JWT)
- **Header**: `Authorization: Bearer <token>`
- **Scope**: `[required-scope]`

### Permissions

This endpoint requires the following permissions:

- `[permission-1]` - Description of permission
- `[permission-2]` - Description of permission

### Example Authentication

```bash
curl -X GET "https://api.idling.app/api/v1/endpoint" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 📝 Request Specification

### HTTP Method

```
[GET|POST|PUT|DELETE|PATCH]
```

### Request Headers

| Header          | Type     | Required | Description                     |
| --------------- | -------- | -------- | ------------------------------- |
| `Authorization` | `string` | **Yes**  | Bearer token for authentication |
| `Content-Type`  | `string` | **Yes**  | Must be `application/json`      |
| `Accept`        | `string` | No       | Response format preference      |
| `X-Request-ID`  | `string` | No       | Request tracking identifier     |

### Path Parameters

| Parameter | Type     | Required | Description                        |
| --------- | -------- | -------- | ---------------------------------- |
| `id`      | `string` | **Yes**  | Unique identifier for the resource |
| `userId`  | `string` | No       | User identifier for filtering      |

### Query Parameters

| Parameter | Type     | Required | Default      | Description                  |
| --------- | -------- | -------- | ------------ | ---------------------------- |
| `limit`   | `number` | No       | `20`         | Maximum number of results    |
| `offset`  | `number` | No       | `0`          | Number of results to skip    |
| `sort`    | `string` | No       | `created_at` | Sort field                   |
| `order`   | `string` | No       | `desc`       | Sort order (`asc` or `desc`) |
| `filter`  | `string` | No       | -            | Filter criteria              |

### Request Body

```typescript
interface RequestBody {
  // Required fields
  name: string;
  description: string;

  // Optional fields
  tags?: string[];
  metadata?: Record<string, any>;
  settings?: {
    enabled: boolean;
    priority: number;
  };
}
```

### Request Example

```json
{
  "name": "Example Resource",
  "description": "This is an example resource",
  "tags": ["example", "demo"],
  "metadata": {
    "category": "test",
    "version": "1.0.0"
  },
  "settings": {
    "enabled": true,
    "priority": 1
  }
}
```

## 📤 Response Specification

### Success Response

#### Status Code: `200 OK`

```typescript
interface SuccessResponse {
  success: true;
  data: {
    id: string;
    name: string;
    description: string;
    tags: string[];
    metadata: Record<string, any>;
    settings: {
      enabled: boolean;
      priority: number;
    };
    createdAt: string;
    updatedAt: string;
  };
  meta?: {
    pagination?: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}
```

#### Response Example

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Example Resource",
    "description": "This is an example resource",
    "tags": ["example", "demo"],
    "metadata": {
      "category": "test",
      "version": "1.0.0"
    },
    "settings": {
      "enabled": true,
      "priority": 1
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "meta": {
    "pagination": {
      "total": 100,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

### Error Responses

#### Status Code: `400 Bad Request`

```typescript
interface BadRequestResponse {
  success: false;
  error: {
    code: 'VALIDATION_ERROR';
    message: string;
    details: {
      field: string;
      message: string;
    }[];
  };
}
```

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "name",
        "message": "Name is required"
      },
      {
        "field": "description",
        "message": "Description must be at least 10 characters"
      }
    ]
  }
}
```

#### Status Code: `401 Unauthorized`

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### Status Code: `403 Forbidden`

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
}
```

#### Status Code: `404 Not Found`

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

#### Status Code: `429 Too Many Requests`

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded",
    "retryAfter": 60
  }
}
```

#### Status Code: `500 Internal Server Error`

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An internal server error occurred"
  }
}
```

## 🚦 Rate Limiting

### Limits

- **Authenticated Users**: 100 requests per minute
- **Anonymous Users**: 20 requests per minute
- **Premium Users**: 500 requests per minute

### Rate Limit Headers

Response includes rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Rate Limit Exceeded

When rate limit is exceeded:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 60 seconds.",
    "retryAfter": 60
  }
}
```

## 📚 Code Examples

### cURL

```bash
# GET request
curl -X GET "https://api.idling.app/api/v1/endpoint?limit=10&offset=0" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"

# POST request
curl -X POST "https://api.idling.app/api/v1/endpoint" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Example Resource",
    "description": "This is an example resource"
  }'
```

### JavaScript/TypeScript

```typescript
// Using fetch
async function callEndpoint() {
  const response = await fetch('https://api.idling.app/api/v1/endpoint', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Example Resource',
      description: 'This is an example resource'
    })
  });

  const data = await response.json();
  return data;
}

// Using axios
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.idling.app/api/v1',
  headers: {
    Authorization: `Bearer ${token}`
  }
});

async function callEndpoint() {
  const response = await api.post('/endpoint', {
    name: 'Example Resource',
    description: 'This is an example resource'
  });

  return response.data;
}
```

### Python

```python
import requests

# GET request
response = requests.get(
    'https://api.idling.app/api/v1/endpoint',
    headers={
        'Authorization': f'Bearer {token}',
        'Accept': 'application/json'
    },
    params={
        'limit': 10,
        'offset': 0
    }
)

data = response.json()

# POST request
response = requests.post(
    'https://api.idling.app/api/v1/endpoint',
    headers={
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    },
    json={
        'name': 'Example Resource',
        'description': 'This is an example resource'
    }
)

data = response.json()
```

### Node.js

```javascript
const https = require('https');

function callEndpoint(token, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

    const options = {
      hostname: 'api.idling.app',
      port: 443,
      path: '/api/v1/endpoint',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        resolve(JSON.parse(responseData));
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}
```

## 🧪 Testing

### Unit Tests

```typescript
import { testEndpoint } from './api-client';

describe('Endpoint API', () => {
  test('should create resource successfully', async () => {
    const mockData = {
      name: 'Test Resource',
      description: 'Test description'
    };

    const response = await testEndpoint.post('/endpoint', mockData);

    expect(response.success).toBe(true);
    expect(response.data.name).toBe('Test Resource');
  });

  test('should handle validation errors', async () => {
    const invalidData = {
      name: '', // Invalid: empty name
      description: 'Test'
    };

    try {
      await testEndpoint.post('/endpoint', invalidData);
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data.error.code).toBe('VALIDATION_ERROR');
    }
  });
});
```

### Integration Tests

```typescript
import { request } from 'supertest';
import { app } from '../app';

describe('Endpoint Integration', () => {
  test('should integrate with authentication', async () => {
    const response = await request(app)
      .post('/api/v1/endpoint')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        name: 'Integration Test',
        description: 'Integration test description'
      })
      .expect(201);

    expect(response.body.success).toBe(true);
  });
});
```

## 📊 Performance

### Response Times

- **Average**: 150ms
- **95th Percentile**: 300ms
- **99th Percentile**: 500ms

### Throughput

- **Requests per second**: 1000
- **Concurrent users**: 500

### Caching

- **Cache TTL**: 300 seconds
- **Cache Key**: `endpoint:{id}:{version}`

## 🔧 Implementation Notes

### Database Queries

```sql
-- Main query for fetching resources
SELECT id, name, description, tags, metadata, settings, created_at, updated_at
FROM resources
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;
```

### Validation Rules

```typescript
const validationSchema = {
  name: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 255
  },
  description: {
    required: true,
    type: 'string',
    minLength: 10,
    maxLength: 1000
  },
  tags: {
    type: 'array',
    items: {
      type: 'string',
      maxLength: 50
    },
    maxItems: 10
  }
};
```

## 🔗 Related Endpoints

- **[GET /api/v1/related-endpoint](../related-endpoint/)** - Related functionality
- **[POST /api/v1/other-endpoint](../other-endpoint/)** - Other related functionality
- **[DELETE /api/v1/endpoint/:id](../endpoint-delete/)** - Delete this resource

## 📚 References

- **[API Authentication](../authentication/)** - Authentication guide
- **[Rate Limiting](../rate-limiting/)** - Rate limiting details
- **[Error Handling](../error-handling/)** - Error response format
- **[Pagination](../pagination/)** - Pagination standards

## 📝 Changelog

### Version 1.2.0

- Added new query parameters
- Improved error messages
- Performance optimizations

### Version 1.1.0

- Added metadata field
- Enhanced validation
- Bug fixes

### Version 1.0.0

- Initial release
- Basic CRUD operations
- Authentication integration

---

**Last Updated**: January 28, 2025
**Author**: [Your Name]
**Reviewers**: [Reviewer Names]
