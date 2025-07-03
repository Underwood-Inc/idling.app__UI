---
layout: default
title: 'Interactive API Tools'
description: 'Swagger UI and testing tools for the Idling.app API'
permalink: /docs/api/interactive/
---

# 🧪 Interactive API Tools

Explore and test the Idling.app API with our interactive tools and documentation.

## 🚀 Swagger UI

Our Swagger UI provides a complete interactive interface for testing the API:

### Development

**[http://localhost:3000/api/swagger](http://localhost:3000/api/swagger)**

### Production

**[https://api.idling.app/docs](https://api.idling.app/docs)**

## 🔧 Getting Started

### 1. Access the Interface

Navigate to the Swagger UI URL in your browser. You'll see a complete list of all available endpoints organized by category.

### 2. Authentication

Before testing protected endpoints, you need to authenticate:

1. Click the **"Authorize"** button at the top right
2. Enter your Bearer token: `Bearer YOUR_TOKEN`
3. Click **"Authorize"**

### 3. Test Endpoints

1. Expand any endpoint section
2. Click **"Try it out"**
3. Fill in required parameters
4. Click **"Execute"**
5. View the response

## 📊 Available Endpoints

### Posts API

- `GET /api/posts` - List all posts
- `POST /api/posts` - Create a new post
- `GET /api/posts/{id}` - Get a specific post
- `PUT /api/posts/{id}` - Update a post
- `DELETE /api/posts/{id}` - Delete a post

### Users API

- `GET /api/users` - List users
- `POST /api/users` - Create user
- `GET /api/users/{id}` - Get user details
- `PUT /api/users/{id}` - Update user

### Categories API

- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `GET /api/categories/{id}` - Get category

### Comments API

- `GET /api/posts/{id}/comments` - List comments
- `POST /api/posts/{id}/comments` - Create comment
- `PUT /api/comments/{id}` - Update comment
- `DELETE /api/comments/{id}` - Delete comment

## 🛠️ Testing Tools

### Postman Collection

Download our Postman collection for comprehensive API testing:

**[Download Postman Collection](https://api.idling.app/postman/collection.json)**

### Import Instructions

1. Open Postman
2. Click **"Import"**
3. Select **"Link"** tab
4. Paste: `https://api.idling.app/postman/collection.json`
5. Click **"Continue"** → **"Import"**

### Environment Variables

Set up these environment variables in Postman:

```json
{
  "baseUrl": "https://api.idling.app/v1",
  "token": "YOUR_API_TOKEN",
  "userId": "123",
  "postId": "456"
}
```

## 🧪 cURL Examples

### Authentication

```bash
# Set your token
export API_TOKEN="your_token_here"
export BASE_URL="https://api.idling.app/v1"
```

### Posts

```bash
# List posts
curl -H "Authorization: Bearer $API_TOKEN" \
     "$BASE_URL/posts"

# Create post
curl -X POST \
     -H "Authorization: Bearer $API_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "My New Post",
       "content": "This is the post content",
       "category_id": 1
     }' \
     "$BASE_URL/posts"

# Get specific post
curl -H "Authorization: Bearer $API_TOKEN" \
     "$BASE_URL/posts/123"

# Update post
curl -X PUT \
     -H "Authorization: Bearer $API_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Updated Title"
     }' \
     "$BASE_URL/posts/123"

# Delete post
curl -X DELETE \
     -H "Authorization: Bearer $API_TOKEN" \
     "$BASE_URL/posts/123"
```

### Users

```bash
# List users
curl -H "Authorization: Bearer $API_TOKEN" \
     "$BASE_URL/users"

# Get user
curl -H "Authorization: Bearer $API_TOKEN" \
     "$BASE_URL/users/123"

# Update user
curl -X PUT \
     -H "Authorization: Bearer $API_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Updated Name",
       "email": "new@example.com"
     }' \
     "$BASE_URL/users/123"
```

## 🔍 Response Examples

### Successful Response

```json
{
  "success": true,
  "data": {
    "id": 123,
    "title": "Example Post",
    "content": "This is an example post content...",
    "author": {
      "id": 456,
      "name": "John Doe",
      "email": "john@example.com"
    },
    "category": {
      "id": 1,
      "name": "Technology",
      "slug": "technology"
    },
    "created_at": "2023-12-01T10:00:00Z",
    "updated_at": "2023-12-01T10:00:00Z"
  },
  "meta": {
    "timestamp": "2023-12-01T10:00:00Z",
    "version": "v1"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The title field is required",
    "details": {
      "field": "title",
      "value": "",
      "constraint": "required"
    }
  },
  "meta": {
    "timestamp": "2023-12-01T10:00:00Z",
    "version": "v1"
  }
}
```

## 🔧 SDK Testing

### JavaScript/TypeScript

```javascript
import { IdlingAPI } from '@idling/api-client';

const api = new IdlingAPI({
  baseURL: 'https://api.idling.app/v1',
  token: 'YOUR_TOKEN'
});

// Test posts
async function testPosts() {
  try {
    // List posts
    const posts = await api.posts.list();
    console.log('Posts:', posts);

    // Create post
    const newPost = await api.posts.create({
      title: 'Test Post',
      content: 'This is a test post'
    });
    console.log('Created:', newPost);

    // Update post
    const updated = await api.posts.update(newPost.id, {
      title: 'Updated Test Post'
    });
    console.log('Updated:', updated);

    // Delete post
    await api.posts.delete(newPost.id);
    console.log('Deleted successfully');
  } catch (error) {
    console.error('Error:', error);
  }
}

testPosts();
```

### Python

```python
import requests
import json

class IdlingAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

    def list_posts(self):
        response = requests.get(f'{self.base_url}/posts', headers=self.headers)
        return response.json()

    def create_post(self, data):
        response = requests.post(f'{self.base_url}/posts',
                               headers=self.headers,
                               json=data)
        return response.json()

# Usage
api = IdlingAPI('https://api.idling.app/v1', 'YOUR_TOKEN')

# Test
posts = api.list_posts()
print(f"Found {len(posts['data'])} posts")

new_post = api.create_post({
    'title': 'Test Post',
    'content': 'This is a test post'
})
print(f"Created post with ID: {new_post['data']['id']}")
```

## 📊 Rate Limit Testing

Test rate limits with this script:

```bash
#!/bin/bash

# Test rate limits
for i in {1..10}; do
  echo "Request $i:"
  curl -s -H "Authorization: Bearer $API_TOKEN" \
       -I "$BASE_URL/posts" | grep -E "(X-RateLimit|HTTP)"
  echo "---"
  sleep 1
done
```

## 🔍 Debugging Tips

### Enable Verbose Output

```bash
# cURL with verbose output
curl -v -H "Authorization: Bearer $API_TOKEN" \
     "$BASE_URL/posts"
```

### Check Response Headers

```bash
# Get only headers
curl -I -H "Authorization: Bearer $API_TOKEN" \
     "$BASE_URL/posts"
```

### Validate JSON

```bash
# Pipe response through jq for validation
curl -H "Authorization: Bearer $API_TOKEN" \
     "$BASE_URL/posts" | jq '.'
```

## 🧪 Advanced Testing

### Pagination Testing

```bash
# Test pagination
curl -H "Authorization: Bearer $API_TOKEN" \
     "$BASE_URL/posts?page=1&limit=5"

curl -H "Authorization: Bearer $API_TOKEN" \
     "$BASE_URL/posts?page=2&limit=5"
```

### Filtering Testing

```bash
# Test filters
curl -H "Authorization: Bearer $API_TOKEN" \
     "$BASE_URL/posts?status=published&category=tech"
```

### Sorting Testing

```bash
# Test sorting
curl -H "Authorization: Bearer $API_TOKEN" \
     "$BASE_URL/posts?sort=-created_at"
```

## 📚 Next Steps

1. 📋 Explore [Core Endpoints](../core/)
2. 🔧 Check [Admin Endpoints](../admin/)
3. 🏗️ Learn about [Architecture](../../architecture/)
4. 🧩 Try [Components](../../../dev/components/)

## 💡 Pro Tips

- **Use the Swagger UI** for quick testing
- **Set up Postman** for comprehensive testing
- **Test error cases** to understand error handling
- **Check rate limits** regularly
- **Validate all responses** with proper JSON tools

## 🆘 Need Help?

- 📚 [API Overview](../overview/)
- 💬 [Discord Community](https://discord.gg/idling-app)
- 🐙 [GitHub Issues](https://github.com/Underwood-Inc/idling.app__UI/issues)
- 📧 [Contact Support](mailto:support@idling.app)

---

Happy testing! 🧪✨
