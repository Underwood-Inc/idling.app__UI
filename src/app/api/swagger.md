---
layout: default
title: 'Swagger UI - Interactive API Documentation'
description: 'Interactive API documentation and testing interface'
permalink: /docs/api/swagger/
---

# 🧪 Swagger UI - Interactive API Documentation

Explore and test the Idling.app API directly in your browser with our interactive Swagger UI interface.

## 🚀 Interactive API Explorer

<div class="swagger-container">
  <div class="swagger-notice">
    <h3>🔧 Development Mode</h3>
    <p>This Swagger UI is configured for development. In production, it will connect to the live API endpoints.</p>
  </div>
  
  <div class="swagger-ui-container">
    <!-- Swagger UI will be embedded here -->
    <div id="swagger-ui"></div>
  </div>
</div>

## 📚 Getting Started with Swagger UI

### 1. Authentication

Before testing endpoints:

1. Click **"Authorize"** button at the top
2. Enter your Bearer token: `Bearer YOUR_TOKEN_HERE`
3. Click **"Authorize"** to save

### 2. Testing Endpoints

1. **Expand** any endpoint section
2. **Click** "Try it out" button
3. **Fill in** required parameters
4. **Click** "Execute" to test

### 3. Response Analysis

- **Response Body**: JSON response data
- **Response Headers**: HTTP headers returned
- **Status Code**: HTTP status code
- **Curl Command**: Copy as cURL command

## 🔐 Authentication Setup

### Getting Your API Token

1. **Login** to your Idling.app account
2. **Navigate** to Settings → API Keys
3. **Generate** a new API key
4. **Copy** the token for use in Swagger UI

### Token Format

```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📋 Available Endpoints

### Authentication Endpoints

- **POST /api/v1/auth/login** - User login
- **POST /api/v1/auth/logout** - User logout
- **POST /api/v1/auth/refresh** - Refresh token
- **GET /api/v1/auth/me** - Get current user

### User Management

- **GET /api/v1/user/profile** - Get user profile
- **PUT /api/v1/user/profile** - Update profile
- **GET /api/v1/user/settings** - Get user settings
- **PUT /api/v1/user/settings** - Update settings

### Content Management

- **GET /api/v1/posts** - List posts
- **POST /api/v1/posts** - Create post
- **GET /api/v1/posts/{id}** - Get specific post
- **PUT /api/v1/posts/{id}** - Update post
- **DELETE /api/v1/posts/{id}** - Delete post

### File Upload

- **POST /api/v1/upload/image** - Upload image
- **POST /api/v1/upload/avatar** - Upload avatar
- **GET /api/v1/upload/signed-url** - Get signed URL

### Administrative (Admin Only)

- **GET /api/v1/admin/users** - List all users
- **GET /api/v1/admin/posts** - List all posts
- **GET /api/v1/admin/analytics** - Get analytics
- **POST /api/v1/admin/actions** - Admin actions

## 🛠️ Testing Examples

### Example 1: Get User Profile

```bash
# Using the generated cURL command
curl -X 'GET' \
  'https://api.idling.app/api/v1/user/profile' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

### Example 2: Create a Post

```bash
curl -X 'POST' \
  'https://api.idling.app/api/v1/posts' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -d '{
    "title": "My New Post",
    "content": "This is the content of my post",
    "tags": ["example", "test"]
  }'
```

## 🚦 Response Codes

### Success Codes

- **200 OK** - Request successful
- **201 Created** - Resource created
- **204 No Content** - Successful deletion

### Error Codes

- **400 Bad Request** - Invalid request data
- **401 Unauthorized** - Authentication required
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource not found
- **429 Too Many Requests** - Rate limit exceeded
- **500 Internal Server Error** - Server error

## 🔍 Advanced Features

### Schema Validation

Swagger UI automatically validates:

- **Request schemas** - Ensures proper data format
- **Response schemas** - Validates API responses
- **Parameter types** - Checks parameter formats

### Code Generation

Generate client code in multiple languages:

- **JavaScript/TypeScript**
- **Python**
- **PHP**
- **Java**
- **C#**
- **Ruby**

### Export Options

- **Download OpenAPI Spec** - Get the raw OpenAPI 3.0 specification
- **Export Postman Collection** - Import into Postman
- **Generate SDK** - Create client libraries

## 🧪 Testing Environment

### Development API

```
Base URL: http://localhost:3000/api/v1
```

### Staging API

```
Base URL: https://api-staging.idling.app/api/v1
```

### Production API

```
Base URL: https://api.idling.app/api/v1
```

## 🔗 Related Resources

- **[API Overview](../index.md)** - Complete API documentation
- **[Authentication Guide](../../getting-started/#authentication)** - Detailed auth setup
- **[Rate Limiting](../../../dev/libraries/services/#rate-limiting)** - Rate limiting details
- **[Admin Documentation](../admin/)** - Administrative endpoints

## 💡 Tips and Tricks

### 1. Save Responses

Right-click on responses to save them for later reference.

### 2. Copy as cURL

Use the "Copy as cURL" feature to test endpoints in your terminal.

### 3. Batch Testing

Test multiple endpoints in sequence to verify workflows.

### 4. Schema Exploration

Click on schema examples to understand data structures.

### 5. Error Testing

Test error scenarios by providing invalid data.

## 🐛 Troubleshooting

### Common Issues

**401 Unauthorized**

- Verify your token is correct
- Check token hasn't expired
- Ensure "Bearer " prefix is included

**CORS Errors**

- Use the correct base URL for your environment
- Ensure your domain is whitelisted

**Rate Limiting**

- Wait for rate limit reset
- Use appropriate delays between requests

### Getting Help

- **GitHub Issues**: Report API bugs
- **Discord**: Real-time support
- **Documentation**: Check the [API docs](../index.md)

---

**Last Updated**: {{ site.time | date: "%B %d, %Y" }}

<script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
<script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-standalone-preset.js"></script>
<link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />

<script>
window.onload = function() {
  // Determine the OpenAPI spec URL based on environment
  const isProduction = window.location.hostname === 'underwood-inc.github.io';
  const isDevelopment = window.location.hostname === 'localhost';
  
  let specUrl;
  if (isDevelopment) {
    specUrl = 'http://localhost:3000/api/openapi.json';
  } else if (isProduction) {
    specUrl = 'https://api.idling.app/api/openapi.json';
  } else {
    specUrl = 'https://api-staging.idling.app/api/openapi.json';
  }

  // Initialize Swagger UI
  const ui = SwaggerUIBundle({
    url: specUrl,
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    plugins: [
      SwaggerUIBundle.plugins.DownloadUrl
    ],
    layout: "StandaloneLayout",
    tryItOutEnabled: true,
    supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
    onComplete: function() {
      console.log('Swagger UI loaded successfully');
    },
    onFailure: function(error) {
      console.error('Failed to load Swagger UI:', error);
      document.getElementById('swagger-ui').innerHTML = 
        '<div class="swagger-error">' +
        '<h3>⚠️ Unable to Load API Specification</h3>' +
        '<p>The API specification could not be loaded. This might be because:</p>' +
        '<ul>' +
        '<li>The API server is not running</li>' +
        '<li>CORS is not configured properly</li>' +
        '<li>The OpenAPI spec URL is incorrect</li>' +
        '</ul>' +
        '<p>Please check the console for more details or contact support.</p>' +
        '</div>';
    }
  });
};
</script>

<style>
.swagger-container {
  margin: 2rem 0;
}

.swagger-notice {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 2rem;
}

.swagger-notice h3 {
  margin-top: 0;
  color: #495057;
}

.swagger-ui-container {
  border: 1px solid #dee2e6;
  border-radius: 8px;
  overflow: hidden;
}

.swagger-error {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  color: #721c24;
}

.swagger-error h3 {
  margin-top: 0;
}

.swagger-error ul {
  text-align: left;
  display: inline-block;
}

/* Customize Swagger UI theme */
.swagger-ui .topbar {
  display: none;
}

.swagger-ui .info {
  margin: 2rem 0;
}

.swagger-ui .scheme-container {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}
</style>
