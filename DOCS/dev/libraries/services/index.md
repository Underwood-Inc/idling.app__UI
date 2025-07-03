---
layout: default
title: 'Core Services'
description: 'Authentication, caching, logging, and rate limiting services'
permalink: /dev/libraries/services/
---

# ⚙️ Core Services

Shared services and utilities that power the Idling.app platform, including authentication, caching, logging, and rate limiting.

## 🛡️ Rate Limiting Service

Comprehensive rate limiting system providing security and performance protection across the entire platform.

### Overview

The Rate Limiting Service implements multiple layers of protection:

- **IP-based limiting** - Prevent abuse from specific IP addresses
- **User-based limiting** - Control per-user request rates
- **Endpoint-specific limits** - Different limits for different API endpoints
- **Sliding window algorithm** - Smooth rate limiting with burst tolerance
- **Redis-backed storage** - Distributed rate limiting across instances

### Configuration

```typescript
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum requests per window
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
  keyGenerator: (req: Request) => string;
  handler: (req: Request, res: Response) => void;
}
```

### Usage Examples

#### Basic Rate Limiting

```typescript
import { rateLimitService } from '@/lib/services/RateLimitService';

// Apply rate limiting to API routes
const apiLimiter = rateLimitService.create({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', apiLimiter);
```

#### User-Specific Rate Limiting

```typescript
const userLimiter = rateLimitService.createUserLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute per user
  keyGenerator: (req) => req.user?.id || req.ip
});

app.use('/api/user/', userLimiter);
```

#### Endpoint-Specific Limits

```typescript
// Different limits for different endpoints
const uploadLimiter = rateLimitService.create({
  windowMs: 60 * 1000,
  max: 5, // Only 5 uploads per minute
  message: 'Upload rate limit exceeded'
});

const searchLimiter = rateLimitService.create({
  windowMs: 60 * 1000,
  max: 100, // 100 searches per minute
  message: 'Search rate limit exceeded'
});

app.use('/api/upload', uploadLimiter);
app.use('/api/search', searchLimiter);
```

### Rate Limit Tiers

Different user types have different rate limits:

```typescript
enum RateLimitTier {
  ANONYMOUS = 'anonymous',
  AUTHENTICATED = 'authenticated',
  PREMIUM = 'premium',
  ADMIN = 'admin'
}

const tierLimits = {
  [RateLimitTier.ANONYMOUS]: {
    requests: 100,
    window: 60 * 60 * 1000 // 1 hour
  },
  [RateLimitTier.AUTHENTICATED]: {
    requests: 1000,
    window: 60 * 60 * 1000 // 1 hour
  },
  [RateLimitTier.PREMIUM]: {
    requests: 5000,
    window: 60 * 60 * 1000 // 1 hour
  },
  [RateLimitTier.ADMIN]: {
    requests: 10000,
    window: 60 * 60 * 1000 // 1 hour
  }
};
```

### Response Headers

Rate limiting information is included in response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
X-RateLimit-Used: 5
```

### Error Responses

When rate limits are exceeded:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again later.",
    "retryAfter": 3600,
    "limit": 100,
    "remaining": 0,
    "reset": 1640995200
  }
}
```

## 🔐 Authentication Service

Comprehensive authentication and authorization system.

### Features

- **JWT token management** - Secure token generation and validation
- **Session management** - User session tracking and cleanup
- **Role-based access control** - Granular permission system
- **Multi-factor authentication** - Optional 2FA support
- **OAuth integration** - Third-party authentication providers

### Usage

```typescript
import { authService } from '@/lib/services/AuthService';

// Authenticate user
const result = await authService.authenticate({
  email: 'user@example.com',
  password: 'securepassword'
});

if (result.success) {
  const { user, token, refreshToken } = result.data;
  // Handle successful authentication
}

// Validate token
const validation = await authService.validateToken(token);
if (validation.valid) {
  const user = validation.user;
  // Token is valid, proceed with request
}
```

### Middleware

```typescript
import { requireAuth, requireRole } from '@/lib/services/AuthService';

// Require authentication
app.use('/api/protected', requireAuth);

// Require specific role
app.use('/api/admin', requireRole('admin'));

// Require specific permissions
app.use('/api/moderate', requirePermissions(['moderate:posts']));
```

## 🗄️ Cache Service

High-performance caching system with multiple backends.

### Features

- **Redis backend** - Distributed caching
- **Memory backend** - Fast local caching
- **Multi-level caching** - L1 (memory) + L2 (Redis)
- **Cache invalidation** - Smart cache busting
- **Compression** - Automatic data compression

### Usage

```typescript
import { cacheService } from '@/lib/services/CacheService';

// Basic caching
await cacheService.set('user:123', userData, 3600); // 1 hour TTL
const userData = await cacheService.get('user:123');

// Pattern-based invalidation
await cacheService.invalidatePattern('user:*');

// Cache with automatic serialization
await cacheService.setObject('posts:trending', trendingPosts, 300);
const posts = await cacheService.getObject('posts:trending');
```

### Cache Strategies

```typescript
// Cache-aside pattern
async function getUser(id: string) {
  let user = await cacheService.get(`user:${id}`);

  if (!user) {
    user = await database.users.findById(id);
    if (user) {
      await cacheService.set(`user:${id}`, user, 3600);
    }
  }

  return user;
}

// Write-through pattern
async function updateUser(id: string, data: UserData) {
  const user = await database.users.update(id, data);
  await cacheService.set(`user:${id}`, user, 3600);
  return user;
}
```

## 📊 Logging Service

Structured logging system with multiple outputs and log levels.

### Features

- **Structured logging** - JSON-formatted logs
- **Multiple transports** - Console, file, database, external services
- **Log levels** - Error, warn, info, debug, trace
- **Contextual logging** - Request correlation IDs
- **Performance monitoring** - Automatic timing and metrics

### Usage

```typescript
import { logger } from '@/lib/services/LoggingService';

// Basic logging
logger.info('User logged in', { userId: '123', ip: '192.168.1.1' });
logger.error('Database connection failed', { error: error.message });

// Contextual logging with correlation ID
const requestLogger = logger.child({ requestId: 'req_123' });
requestLogger.info('Processing request');
requestLogger.debug('Validation passed');
requestLogger.info('Request completed', { duration: 150 });
```

### Log Levels

```typescript
logger.error('Critical error occurred'); // Level 0
logger.warn('Warning condition'); // Level 1
logger.info('General information'); // Level 2
logger.debug('Debug information'); // Level 3
logger.trace('Detailed trace info'); // Level 4
```

### Performance Monitoring

```typescript
// Automatic timing
const timer = logger.startTimer();
await performExpensiveOperation();
timer.done({ message: 'Operation completed' });

// Custom metrics
logger.metric('api.response_time', 150, { endpoint: '/api/users' });
logger.counter('api.requests', 1, { method: 'GET', status: 200 });
```

## 📧 Notification Service

Multi-channel notification system for user communications.

### Features

- **Email notifications** - Transactional and marketing emails
- **Push notifications** - Browser and mobile push
- **In-app notifications** - Real-time notifications
- **SMS notifications** - Text message alerts
- **Webhook notifications** - External system integration

### Usage

```typescript
import { notificationService } from '@/lib/services/NotificationService';

// Send email notification
await notificationService.sendEmail({
  to: 'user@example.com',
  template: 'welcome',
  data: { userName: 'John Doe' }
});

// Send push notification
await notificationService.sendPush({
  userId: '123',
  title: 'New Message',
  body: 'You have a new message from Jane',
  data: { messageId: 'msg_456' }
});

// Send in-app notification
await notificationService.sendInApp({
  userId: '123',
  type: 'info',
  title: 'Profile Updated',
  message: 'Your profile has been successfully updated'
});
```

## 🔍 Search Service

Full-text search capabilities with advanced filtering and ranking.

### Features

- **Elasticsearch backend** - Powerful search engine
- **Full-text search** - Natural language queries
- **Faceted search** - Category and filter-based search
- **Autocomplete** - Real-time search suggestions
- **Analytics** - Search metrics and optimization

### Usage

```typescript
import { searchService } from '@/lib/services/SearchService';

// Basic search
const results = await searchService.search({
  query: 'javascript tutorial',
  filters: { category: 'programming' },
  limit: 20,
  offset: 0
});

// Advanced search with facets
const advancedResults = await searchService.advancedSearch({
  query: 'react hooks',
  filters: {
    tags: ['react', 'javascript'],
    dateRange: { from: '2024-01-01', to: '2024-12-31' }
  },
  sort: { field: 'relevance', order: 'desc' },
  facets: ['category', 'author', 'tags']
});

// Autocomplete suggestions
const suggestions = await searchService.suggest({
  query: 'java',
  limit: 10
});
```

## 📈 Analytics Service

Comprehensive analytics and metrics collection system.

### Features

- **Event tracking** - Custom event collection
- **User analytics** - User behavior tracking
- **Performance metrics** - Application performance monitoring
- **Business metrics** - KPI and conversion tracking
- **Real-time dashboards** - Live metrics visualization

### Usage

```typescript
import { analyticsService } from '@/lib/services/AnalyticsService';

// Track custom events
await analyticsService.track('user_signup', {
  userId: '123',
  source: 'google',
  campaign: 'summer_2024'
});

// Track page views
await analyticsService.pageView({
  userId: '123',
  page: '/dashboard',
  referrer: '/login'
});

// Track performance metrics
await analyticsService.performance({
  metric: 'api_response_time',
  value: 150,
  tags: { endpoint: '/api/users', method: 'GET' }
});
```

## 🔧 Configuration

All services are configured through environment variables and configuration files:

```typescript
// config/services.ts
export const servicesConfig = {
  rateLimit: {
    redis: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT),
      password: process.env.REDIS_PASSWORD
    },
    defaultLimits: {
      windowMs: 15 * 60 * 1000,
      max: 100
    }
  },

  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiration: '24h',
    refreshExpiration: '7d'
  },

  cache: {
    redis: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT)
    },
    defaultTTL: 3600
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    transports: ['console', 'file'],
    filename: 'logs/app.log'
  }
};
```

## 🧪 Testing

All services include comprehensive test suites:

```typescript
// Example test for rate limiting service
describe('RateLimitService', () => {
  test('should limit requests when threshold exceeded', async () => {
    const limiter = rateLimitService.create({
      windowMs: 1000,
      max: 2
    });

    // First two requests should succeed
    await expect(limiter(mockReq, mockRes, mockNext)).resolves.toBeUndefined();
    await expect(limiter(mockReq, mockRes, mockNext)).resolves.toBeUndefined();

    // Third request should be rate limited
    await expect(limiter(mockReq, mockRes, mockNext)).rejects.toThrow(
      'Rate limit exceeded'
    );
  });
});
```

## 🔗 Related Documentation

- **[API Documentation](../../../docs/api/)** - API endpoints using these services
- **[Testing Guide](../../testing/)** - Testing strategies for services
- **[Deployment Guide](../../../docs/deployment/)** - Service deployment configuration
- **[Architecture](../../../docs/architecture/)** - System architecture overview

---

**Last Updated**: {{ site.time | date: "%B %d, %Y" }}

> **Performance Note**: All services are optimized for high throughput and low latency. Monitor service metrics and adjust configuration as needed for your specific use case.
