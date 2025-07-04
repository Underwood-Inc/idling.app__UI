---
layout: default
title: 'Admin API Documentation'
description: 'Administrative API endpoints and functionality'
permalink: /docs/api/admin/
---

# 🔐 Admin API Documentation

Administrative API endpoints for managing users, content, and platform operations. These endpoints require elevated permissions and are restricted to authorized administrators.

## 🛡️ Authentication & Authorization

### Required Permissions

All admin endpoints require:

- **Valid JWT token** with admin privileges
- **Admin role** assigned to the user account
- **Specific permissions** for each endpoint category

### Admin Token Format

```bash
Authorization: Bearer ADMIN_JWT_TOKEN_HERE
```

### Permission Levels

| Permission     | Description       | Endpoints                  |
| -------------- | ----------------- | -------------------------- |
| `admin:read`   | View admin data   | GET endpoints              |
| `admin:write`  | Modify admin data | POST, PUT, PATCH endpoints |
| `admin:delete` | Delete admin data | DELETE endpoints           |
| `admin:super`  | Full admin access | All admin endpoints        |

## 👥 User Management

### List All Users

**GET** `/api/v1/admin/users`

Retrieve a paginated list of all platform users.

#### Query Parameters

| Parameter | Type     | Default      | Description                                      |
| --------- | -------- | ------------ | ------------------------------------------------ |
| `limit`   | `number` | `50`         | Maximum users per page                           |
| `offset`  | `number` | `0`          | Number of users to skip                          |
| `status`  | `string` | `all`        | Filter by status: `active`, `inactive`, `banned` |
| `role`    | `string` | `all`        | Filter by role: `user`, `admin`, `moderator`     |
| `search`  | `string` | -            | Search by username or email                      |
| `sort`    | `string` | `created_at` | Sort field                                       |
| `order`   | `string` | `desc`       | Sort order: `asc`, `desc`                        |

#### Example Request

```bash
curl -X GET "https://api.idling.app/api/v1/admin/users?limit=20&status=active" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Accept: application/json"
```

#### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "user_123",
      "username": "johndoe",
      "email": "john@example.com",
      "status": "active",
      "role": "user",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "lastLoginAt": "2024-01-15T10:30:00.000Z",
      "postCount": 25,
      "isVerified": true
    }
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

### Get User Details

**GET** `/api/v1/admin/users/{userId}`

Retrieve detailed information about a specific user.

#### Path Parameters

| Parameter | Type     | Description         |
| --------- | -------- | ------------------- |
| `userId`  | `string` | User ID to retrieve |

#### Example Request

```bash
curl -X GET "https://api.idling.app/api/v1/admin/users/user_123" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Update User

**PUT** `/api/v1/admin/users/{userId}`

Update user information and settings.

#### Request Body

```json
{
  "status": "active",
  "role": "moderator",
  "isVerified": true,
  "notes": "Promoted to moderator"
}
```

### Ban/Unban User

**POST** `/api/v1/admin/users/{userId}/ban`

Ban or unban a user account.

#### Request Body

```json
{
  "action": "ban",
  "reason": "Violation of community guidelines",
  "duration": "7d",
  "notes": "Temporary ban for spam"
}
```

## 📝 Content Management

### List All Posts

**GET** `/api/v1/admin/posts`

Retrieve all posts across the platform with admin metadata.

#### Query Parameters

| Parameter  | Type      | Default      | Description                                                 |
| ---------- | --------- | ------------ | ----------------------------------------------------------- |
| `limit`    | `number`  | `50`         | Maximum posts per page                                      |
| `offset`   | `number`  | `0`          | Number of posts to skip                                     |
| `status`   | `string`  | `all`        | Filter by status: `published`, `draft`, `hidden`, `flagged` |
| `author`   | `string`  | -            | Filter by author user ID                                    |
| `reported` | `boolean` | -            | Show only reported posts                                    |
| `sort`     | `string`  | `created_at` | Sort field                                                  |
| `order`    | `string`  | `desc`       | Sort order                                                  |

#### Example Request

```bash
curl -X GET "https://api.idling.app/api/v1/admin/posts?reported=true&limit=10" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

#### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "post_456",
      "title": "Example Post",
      "content": "Post content...",
      "author": {
        "id": "user_123",
        "username": "johndoe"
      },
      "status": "flagged",
      "reportCount": 3,
      "reports": [
        {
          "reason": "spam",
          "reportedBy": "user_789",
          "reportedAt": "2024-01-15T09:00:00.000Z"
        }
      ],
      "createdAt": "2024-01-14T15:30:00.000Z",
      "updatedAt": "2024-01-15T09:00:00.000Z"
    }
  ],
  "meta": {
    "pagination": {
      "total": 150,
      "limit": 10,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

### Moderate Post

**POST** `/api/v1/admin/posts/{postId}/moderate`

Take moderation action on a post.

#### Request Body

```json
{
  "action": "hide",
  "reason": "Inappropriate content",
  "notes": "Hidden pending review",
  "notifyAuthor": true
}
```

#### Available Actions

- `approve` - Approve flagged post
- `hide` - Hide post from public view
- `delete` - Permanently delete post
- `flag` - Flag for further review

## 📊 Analytics & Reports

### Platform Analytics

**GET** `/api/v1/admin/analytics`

Retrieve platform-wide analytics and metrics.

#### Query Parameters

| Parameter | Type       | Default | Description                                 |
| --------- | ---------- | ------- | ------------------------------------------- |
| `period`  | `string`   | `7d`    | Time period: `1d`, `7d`, `30d`, `90d`, `1y` |
| `metrics` | `string[]` | `all`   | Specific metrics to include                 |

#### Example Request

```bash
curl -X GET "https://api.idling.app/api/v1/admin/analytics?period=30d" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

#### Response

```json
{
  "success": true,
  "data": {
    "period": "30d",
    "users": {
      "total": 10000,
      "active": 7500,
      "new": 250,
      "growth": "+2.5%"
    },
    "content": {
      "totalPosts": 50000,
      "newPosts": 1200,
      "moderatedPosts": 45,
      "flaggedPosts": 23
    },
    "engagement": {
      "avgSessionDuration": "15m 30s",
      "dailyActiveUsers": 2500,
      "postsPerUser": 6.7
    },
    "moderation": {
      "reportsReceived": 67,
      "reportsResolved": 62,
      "averageResolutionTime": "2h 15m"
    }
  }
}
```

### User Activity Report

**GET** `/api/v1/admin/reports/user-activity`

Generate detailed user activity reports.

#### Query Parameters

| Parameter        | Type      | Description                    |
| ---------------- | --------- | ------------------------------ |
| `userId`         | `string`  | Specific user ID (optional)    |
| `startDate`      | `string`  | Start date (ISO format)        |
| `endDate`        | `string`  | End date (ISO format)          |
| `includeDetails` | `boolean` | Include detailed activity logs |

### Content Moderation Report

**GET** `/api/v1/admin/reports/moderation`

Generate content moderation reports and statistics.

## 🔧 Administrative Actions

### System Maintenance

**POST** `/api/v1/admin/system/maintenance`

Trigger system maintenance tasks.

#### Request Body

```json
{
  "action": "cache_clear",
  "scope": "all",
  "notify": true
}
```

#### Available Actions

- `cache_clear` - Clear application cache
- `rebuild_search` - Rebuild search indexes
- `cleanup_uploads` - Clean up orphaned files
- `backup_database` - Trigger database backup

### Send Platform Notification

**POST** `/api/v1/admin/notifications/broadcast`

Send platform-wide notifications to users.

#### Request Body

```json
{
  "title": "Platform Update",
  "message": "We've released new features!",
  "type": "info",
  "targets": ["all"],
  "schedule": "immediate"
}
```

### Feature Flags

**GET** `/api/v1/admin/feature-flags`

Manage platform feature flags and toggles.

**PUT** `/api/v1/admin/feature-flags/{flagName}`

Update feature flag settings.

## 🚦 Rate Limiting

### Admin Rate Limits

- **General Admin**: 5000 requests per hour
- **Super Admin**: 10000 requests per hour
- **System Actions**: 100 requests per hour

### Rate Limit Headers

```
X-RateLimit-Limit: 5000
X-RateLimit-Remaining: 4999
X-RateLimit-Reset: 1640995200
X-Admin-Tier: general
```

## 🔍 Audit Logging

All admin actions are automatically logged with:

- **Timestamp** - When the action occurred
- **Admin User** - Who performed the action
- **Action Type** - What was done
- **Target** - What was affected
- **IP Address** - Where the action originated
- **User Agent** - Client information

### View Audit Logs

**GET** `/api/v1/admin/audit-logs`

Retrieve admin action audit logs.

#### Query Parameters

| Parameter   | Type     | Description           |
| ----------- | -------- | --------------------- |
| `adminId`   | `string` | Filter by admin user  |
| `action`    | `string` | Filter by action type |
| `startDate` | `string` | Start date filter     |
| `endDate`   | `string` | End date filter       |
| `limit`     | `number` | Results per page      |
| `offset`    | `number` | Results offset        |

## 🚨 Error Handling

### Admin-Specific Errors

#### 403 Insufficient Permissions

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_ADMIN_PERMISSIONS",
    "message": "This action requires super admin privileges",
    "requiredPermission": "admin:super"
  }
}
```

#### 423 Resource Locked

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_LOCKED",
    "message": "This resource is currently being modified by another admin",
    "lockedBy": "admin_user_456",
    "lockedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## 🔗 Related Documentation

- **[API Overview](../index.md)** - General API documentation
- **[Authentication Guide](../../getting-started/#authentication)** - Auth setup
- **[Rate Limiting](../../../dev/libraries/services/#rate-limiting)** - Rate limiting details
- **[Security Architecture](../../architecture/security/)** - Security patterns

## 💡 Best Practices

### 1. Audit Trail

Always include meaningful notes when taking moderation actions:

```json
{
  "action": "ban",
  "reason": "Spam violation",
  "notes": "User posted 50+ promotional links in 1 hour"
}
```

### 2. Batch Operations

Use batch endpoints for bulk operations when available:

```bash
POST /api/v1/admin/users/bulk-update
```

### 3. Monitoring

Monitor admin actions and set up alerts for:

- High-frequency admin actions
- Failed admin requests
- Unusual admin activity patterns

### 4. Security

- Use dedicated admin accounts
- Enable 2FA for admin accounts
- Regularly rotate admin tokens
- Monitor admin access logs

## 📞 Admin Support

### Emergency Contacts

- **Security Issues**: security@idling.app
- **Platform Issues**: admin-support@idling.app
- **On-call Admin**: +1-555-ADMIN-24

### Admin Resources

- **Admin Dashboard**: admin.idling.app
- **Admin Documentation**: Internal admin wiki
- **Admin Training**: Quarterly training sessions

---

**Last Updated**: {{ site.time | date: "%B %d, %Y" }}
**Admin API Version**: v1.0.0

> **⚠️ Security Notice**: Admin endpoints are logged and monitored. All actions are subject to audit and review.
