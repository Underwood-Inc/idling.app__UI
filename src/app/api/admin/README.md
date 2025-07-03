---
title: '🔧 Admin Endpoints'
description: 'Administrative endpoints for system management'
---

# 🔧 Admin Endpoints

Administrative endpoints for system management and configuration. These endpoints require elevated permissions.

## Authentication

All admin endpoints require:

- Valid authentication token
- Admin role permissions
- Additional rate limiting applies

## User Administration

### GET /api/v1/admin/users

List all users with admin details.

**Query Parameters:**

- `page` - Page number
- `limit` - Results per page
- `status` - Filter by user status (active, suspended, deleted)
- `role` - Filter by user role

**Response:**

```json
{
  "status": "success",
  "data": {
    "users": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

### POST /api/v1/admin/users

Create new user account.

### PUT /api/v1/admin/users/:id

Update any user account.

### DELETE /api/v1/admin/users/:id

Delete user account (soft delete).

### POST /api/v1/admin/users/:id/suspend

Suspend user account.

### POST /api/v1/admin/users/:id/restore

Restore suspended user account.

## Content Management

### GET /api/v1/admin/content

List all content with moderation details.

### PUT /api/v1/admin/content/:id/moderate

Moderate content item.

**Request:**

```json
{
  "action": "approve|reject|flag",
  "reason": "Optional moderation reason"
}
```

### DELETE /api/v1/admin/content/:id

Permanently delete content.

## System Configuration

### GET /api/v1/admin/config

Get system configuration.

### PUT /api/v1/admin/config

Update system configuration.

**Request:**

```json
{
  "maintenance_mode": false,
  "registration_enabled": true,
  "max_upload_size": 10485760,
  "rate_limits": {
    "authenticated": 1000,
    "anonymous": 100
  }
}
```

## Analytics & Reporting

### GET /api/v1/admin/analytics/overview

Get system analytics overview.

**Response:**

```json
{
  "status": "success",
  "data": {
    "users": {
      "total": 1250,
      "active_today": 45,
      "new_this_week": 12
    },
    "content": {
      "total": 5670,
      "created_today": 23,
      "pending_moderation": 8
    },
    "system": {
      "uptime": "99.9%",
      "response_time": "120ms",
      "error_rate": "0.1%"
    }
  }
}
```

### GET /api/v1/admin/analytics/users

Detailed user analytics.

### GET /api/v1/admin/analytics/content

Content creation and engagement analytics.

### GET /api/v1/admin/logs

System logs with filtering.

**Query Parameters:**

- `level` - Log level (error, warn, info, debug)
- `service` - Filter by service name
- `from` - Start date (ISO 8601)
- `to` - End date (ISO 8601)

## Maintenance

### POST /api/v1/admin/maintenance/enable

Enable maintenance mode.

### POST /api/v1/admin/maintenance/disable

Disable maintenance mode.

### POST /api/v1/admin/cache/clear

Clear application cache.

### GET /api/v1/admin/health

Comprehensive system health check.

**Response:**

```json
{
  "status": "success",
  "data": {
    "database": "healthy",
    "cache": "healthy",
    "storage": "healthy",
    "external_apis": "healthy",
    "memory_usage": "65%",
    "disk_usage": "42%"
  }
}
```

## Permissions Required

| Endpoint Category  | Required Role | Additional Permissions |
| ------------------ | ------------- | ---------------------- |
| User Management    | `admin`       | `users:manage`         |
| Content Moderation | `moderator`   | `content:moderate`     |
| System Config      | `super_admin` | `system:configure`     |
| Analytics          | `admin`       | `analytics:read`       |
| Maintenance        | `super_admin` | `system:maintain`      |

## Rate Limiting

Admin endpoints have stricter rate limits:

- **Super Admin**: 500 requests per hour
- **Admin**: 300 requests per hour
- **Moderator**: 200 requests per hour

## Security Notes

- All admin actions are logged
- IP address restrictions may apply
- Multi-factor authentication recommended
- Session timeouts are shorter for admin accounts

## Next Steps

- Review [Core Endpoints](../README.md) for regular API functionality
- Check [API Overview](../README.md) for authentication setup
- Use [Interactive Tools](../swagger.md) for testing (admin token required)
