---
layout: default
title: API Documentation
description: Complete guide to the idling.app API endpoints and how to use them
---

# 🔌 API Documentation

Welcome to the idling.app API documentation! This guide explains all the available endpoints in simple terms that anyone can understand.

## 🎯 What is an API?

Think of an API like a waiter in a restaurant:

- **You (the customer)** make a request ("I'd like a burger")
- **The waiter (API)** takes your request to the kitchen
- **The kitchen (server)** prepares your order
- **The waiter** brings back your food

In our app:

- **Your browser** makes a request ("Show me the latest posts")
- **The API** processes your request
- **The database** gets the information
- **The API** sends back the data to display

## 📚 API Categories

### 🔐 Authentication APIs

Handle user login, logout, and session management

- **Auth Routes** - Login and authentication _(documentation coming soon)_

### 👥 User Management APIs

Manage user accounts, profiles, and permissions

- **User APIs** - User profiles and settings _(documentation coming soon)_
- **Profile APIs** - Public user profiles _(documentation coming soon)_
- **Admin User APIs** - User management (admin only) _(documentation coming soon)_

### 📝 Content APIs

Handle posts, comments, and user-generated content

- **Posts APIs** - Create, read, update posts _(documentation coming soon)_
- **Comments APIs** - Post comments and replies _(documentation coming soon)_

### 😀 Emoji APIs

Manage custom emojis and emoji usage

- **[Emoji APIs](./emojis)** - Browse and use emojis
- **Admin Emoji APIs** - Emoji approval (admin only) _(documentation coming soon)_

### 📁 File Upload APIs

Handle file uploads and media

- **[Upload APIs](./upload)** - Image and file uploads

### ⚙️ System APIs

System administration and monitoring

- **Admin System APIs** - System management (admin only) _(documentation coming soon)_
- **Test APIs** - Testing and debugging _(documentation coming soon)_

## 🚀 Quick Start Guide

### Making Your First API Call

The easiest way to test our API is using your web browser or a tool like curl:

```bash
# Get basic information about available emojis
curl https://yourdomain.com/api/emojis

# Check if you're logged in
curl https://yourdomain.com/api/test/admin-check
```

### Understanding API Responses

All our APIs return data in JSON format (JavaScript Object Notation). Here's what a typical response looks like:

```json
{
  "success": true,
  "data": {
    "message": "Hello, world!"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**What each part means:**

- **success**: `true` if everything worked, `false` if there was an error
- **data**: The actual information you requested
- **timestamp**: When the response was generated

### Error Responses

When something goes wrong, you'll get an error response:

```json
{
  "error": "User not found",
  "status": 404
}
```

**Common error codes:**

- **400**: Bad request (you sent invalid data)
- **401**: Unauthorized (you need to log in)
- **403**: Forbidden (you don't have permission)
- **404**: Not found (the resource doesn't exist)
- **500**: Server error (something went wrong on our end)

## 🔑 Authentication

### How Authentication Works

Most API endpoints require you to be logged in. Here's how it works:

1. **Log in through the website** - Use the normal login form
2. **Your browser gets a session cookie** - This proves you're logged in
3. **API calls include the cookie** - The API knows who you are
4. **API responds with your data** - You get personalized results

### Public vs Protected Endpoints

**Public endpoints** (no login required):

- Browse emojis: `GET /api/emojis`
- View public profiles: `GET /api/profile/[username]`

**Protected endpoints** (login required):

- Upload images: `POST /api/upload/image`
- Check timeout status: `GET /api/user/timeout`

**Admin endpoints** (admin privileges required):

- Manage users: `POST /api/admin/users/timeout`
- Approve emojis: `POST /api/admin/emojis`

## 📖 How to Read API Documentation

Each API endpoint is documented with:

### Endpoint Format

```
METHOD /api/path
```

**Examples:**

- `GET /api/emojis` - Get a list of emojis
- `POST /api/upload/image` - Upload an image
- `DELETE /api/admin/users/timeout` - Remove a user timeout

### Request Information

- **URL parameters**: Values in the URL path
- **Query parameters**: Values after the `?` in the URL
- **Request body**: Data you send with POST/PUT requests

### Response Information

- **Success responses**: What you get when everything works
- **Error responses**: What you get when something goes wrong
- **Example responses**: Real examples you can expect

## 🛠️ Testing APIs

### Using curl (Command Line)

```bash
# GET request (retrieve data)
curl https://yourdomain.com/api/emojis

# POST request (send data)
curl -X POST https://yourdomain.com/api/upload/image \
  -F "file=@image.jpg"

# With authentication (if you have a session token)
curl -H "Cookie: your-session-cookie" \
  https://yourdomain.com/api/user/timeout
```

### Using Browser Developer Tools

1. **Open your browser's developer tools** (F12)
2. **Go to the Network tab**
3. **Navigate your app normally**
4. **See all API calls** in the network log
5. **Click on any request** to see details

### Using Postman or Similar Tools

1. **Download Postman** (free API testing tool)
2. **Create a new request**
3. **Set the method** (GET, POST, etc.)
4. **Enter the URL** (https://yourdomain.com/api/...)
5. **Add any required data**
6. **Send the request**

## 📝 API Best Practices

### For Developers Using Our API

**Rate Limiting:**

- Don't make too many requests too quickly
- Wait at least 100ms between requests
- If you get a 429 error, slow down

**Error Handling:**

- Always check the response status
- Handle errors gracefully
- Retry failed requests with exponential backoff

**Caching:**

- Cache responses when appropriate
- Respect cache headers
- Don't cache user-specific data globally

### Data Formats

**Sending Data:**

- Use JSON format for POST/PUT requests
- Set `Content-Type: application/json` header
- Validate data before sending

**Receiving Data:**

- All responses are in JSON format
- Check the `success` field first
- Handle missing or null fields

## 🔗 Quick Reference

### Most Common Endpoints

| Purpose            | Method | Endpoint                  | Auth Required |
| ------------------ | ------ | ------------------------- | ------------- |
| Get emojis         | GET    | `/api/emojis`             | No            |
| Upload image       | POST   | `/api/upload/image`       | Yes           |
| Check user profile | GET    | `/api/profile/[username]` | No            |
| Check login status | GET    | `/api/test/admin-check`   | No            |
| Track emoji usage  | POST   | `/api/emojis/usage`       | No            |

### Response Status Codes

| Code | Meaning      | What to Do                |
| ---- | ------------ | ------------------------- |
| 200  | Success      | Everything worked         |
| 400  | Bad Request  | Check your data format    |
| 401  | Unauthorized | Log in first              |
| 403  | Forbidden    | You don't have permission |
| 404  | Not Found    | Check the URL             |
| 500  | Server Error | Try again later           |

## 📞 Getting Help

### Common Issues

**"Unauthorized" errors:**

- Make sure you're logged in
- Check if your session expired
- Try logging out and back in

**"Not Found" errors:**

- Check the URL spelling
- Make sure the endpoint exists
- Verify the HTTP method (GET vs POST)

**"Bad Request" errors:**

- Validate your JSON format
- Check required fields
- Verify data types

### Where to Get Support

1. **Check this documentation** first
2. **Look at example responses** in each endpoint guide
3. **Test with simple curl commands**
4. **Check browser developer tools** for network errors
5. **Ask for help** with specific error messages

---

## 🔗 Detailed API Guides

- **[Emoji APIs](./emojis)** - Browse and use emojis
- **[Upload APIs](./upload)** - File and image uploads
- **Authentication APIs** - Login and session management _(coming soon)_
- **User Management APIs** - User accounts and profiles _(coming soon)_
- **Admin APIs** - Administrative functions _(coming soon)_

---

_This API documentation is designed to be helpful for both technical developers and non-technical users who want to understand how our app works behind the scenes._
