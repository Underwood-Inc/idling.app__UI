# Rate Limiting + SSE Integration 🚨⚡

## Overview

The rate limiting system now integrates seamlessly with our robust SSE (Server-Sent Events) communication layer to provide **instant real-time notifications** when users hit rate limits. This replaces the old polling-based approach with immediate, reliable notifications.

## 🎯 Key Features

### ✅ **Instant Notifications**

- Rate limit violations trigger immediate SSE notifications
- No more polling or delays - users get instant feedback
- Works for all rate limit types: API, auth, upload, search, admin, SSE

### ✅ **Multi-layered Rate Limiting**

- **Device-level**: Primary rate limiting per device
- **Network-level**: Household-wide protection against abuse
- **User-level**: Authenticated user-specific limits

### ✅ **Smart Targeting**

- **Authenticated Users**: Get instant SSE notifications
- **Anonymous Users**: Fall back to sessionStorage polling (legacy)
- **Attack Detection**: Special security alerts for suspicious activity

### ✅ **Banner System Integration**

- Rate limit notifications appear as banners with countdown timers
- Different styling for normal limits vs. security attacks
- Dismissible with proper persistence handling

## 🔄 How It Works

### 1. **Middleware Detection**

```typescript
// middleware.ts - Rate limit exceeded
if (!deviceRateLimitResult.allowed) {
  // Send real-time SSE notification
  await sendRateLimitNotification(
    userId,
    deviceRateLimitResult,
    deviceRateLimitResult.isAttack,
    nextUrl.pathname
  );

  return createRateLimitResponse(deviceRateLimitResult);
}
```

### 2. **SSE Transmission**

```typescript
// lib/sse/utils.ts - Utility function
export async function sendRateLimitNotification(
  userId: number,
  rateLimitResult: {
    retryAfter?: number;
    penaltyLevel?: number;
    quotaType?: string;
    retryAfterHuman?: string;
  },
  isAttack: boolean = false,
  endpoint?: string
): Promise<{ sent: number; failed: number }>;
```

### 3. **Client Reception**

```typescript
// BannerSystem.tsx - SSE client handling
client.on('alert', (data) => {
  if (data.type === 'rate-limit') {
    addBanner({
      id: data.id || `rate-limit-${Date.now()}`,
      type: 'rate-limit',
      title: data.title || 'Rate Limit Exceeded',
      message: data.message,
      retryAfter: data.retryAfter
      // ... banner configuration
    });
  }
});
```

### 4. **Banner Display**

- Rate limit banners appear instantly with countdown timers
- Show retry time in human-readable format ("Try again in 2 minutes")
- Different colors/styling for attacks vs. normal limits
- Dismissible with proper persistence

## 🛠️ Configuration

### Rate Limit Types & Limits

```typescript
// lib/services/RateLimitService.ts
export class RateLimitService {
  public static readonly CONFIGS = {
    api: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100 // 100 requests per minute
    },
    auth: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 500 // 500 auth requests per minute
    },
    upload: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 5 // 5 uploads per minute
    },
    search: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 200 // 200 searches per minute
    },
    admin: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 50 // 50 admin actions per minute
    },
    sse: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 1000 // 1000 requests per minute (very generous)
    }
  };
}
```

### SSE Client Configuration

```typescript
// BannerSystem.tsx - Robust SSE client
const client = new SSEClient({
  url: '/api/sse/stream',
  debug: process.env.NODE_ENV === 'development',
  reconnect: {
    enabled: true,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 1.5,
    maxAttempts: 10
  },
  heartbeat: {
    enabled: true,
    timeout: 45000
  }
});
```

## 🧪 Testing

### Development Test Endpoint

```bash
# Test normal rate limit notification
curl -X POST http://localhost:3000/api/admin/test-rate-limit \
  -H "Content-Type: application/json" \
  -d '{"testType": "normal"}'

# Test security attack notification
curl -X POST http://localhost:3000/api/admin/test-rate-limit \
  -H "Content-Type: application/json" \
  -d '{"testType": "attack"}'

# Test for specific user (admin only)
curl -X POST http://localhost:3000/api/admin/test-rate-limit \
  -H "Content-Type: application/json" \
  -d '{"testType": "normal", "targetUserId": 123}'
```

### Console Testing

```javascript
// In browser console (development only)
fetch('/api/admin/test-rate-limit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ testType: 'normal' })
})
  .then((r) => r.json())
  .then(console.log);
```

## 📊 Rate Limit Response Format

### HTTP Response (429 Too Many Requests)

```json
{
  "error": "Rate limit exceeded. Please try again in 1 minute.",
  "retryAfter": 60,
  "retryAfterHuman": "1 minute",
  "penaltyLevel": 1,
  "quotaType": "api"
}
```

### SSE Alert Format

```json
{
  "id": "rate-limit-1704067200000",
  "type": "rate-limit",
  "title": "Rate Limit Exceeded",
  "message": "Too many requests. Please slow down.",
  "retryAfter": 60,
  "retryAfterHuman": "1 minute",
  "penaltyLevel": 1,
  "quotaType": "api",
  "endpoint": "/api/posts",
  "timestamp": 1704067200000,
  "dismissible": true,
  "priority": 90,
  "metadata": {
    "isAttack": false,
    "endpoint": "/api/posts",
    "quotaType": "api",
    "penaltyLevel": 1
  }
}
```

## 🔐 Security Features

### Attack Detection

- **Penalty Levels**: Progressive penalties for repeated violations
- **Network-wide Blocking**: Household-wide limits for severe abuse
- **Security Alerts**: Special notifications for suspicious activity
- **Enhanced Logging**: Detailed logs for security monitoring

### Attack Response Example

```json
{
  "title": "Security Alert",
  "message": "Suspicious activity detected. Access temporarily restricted.",
  "priority": 95,
  "metadata": {
    "isAttack": true,
    "penaltyLevel": 3
  }
}
```

## 🎨 Banner Styling

### Normal Rate Limit

- **Color**: Orange/Yellow warning colors
- **Icon**: ⏰ Clock icon
- **Priority**: 90
- **Dismissible**: Yes

### Security Attack

- **Color**: Red danger colors
- **Icon**: 🚨 Alert icon
- **Priority**: 95
- **Dismissible**: Yes (but persistent)

## 🔧 Fallback Mechanisms

### For Anonymous Users

- SSE notifications require user authentication
- Anonymous users fall back to sessionStorage polling
- Reduced polling frequency (5 seconds vs 1 second)
- Legacy compatibility maintained

### Error Handling

- SSE connection failures gracefully degrade to polling
- Middleware continues to work even if SSE fails
- Comprehensive error logging and monitoring

## 🚀 Performance Benefits

### Before (Polling)

- ❌ 1-second polling intervals
- ❌ Constant sessionStorage checks
- ❌ Delayed notifications (up to 1 second)
- ❌ Unnecessary network overhead

### After (SSE)

- ✅ Instant real-time notifications
- ✅ No polling overhead for authenticated users
- ✅ Efficient WebSocket-like persistent connections
- ✅ Automatic reconnection with backoff

## 📈 Monitoring

### SSE Connection Status

```typescript
// Available in banner system debug panel
{
  connectionStatus: 'connected',
  lastUpdate: '2024-01-01T12:00:00.000Z',
  retryCount: 0,
  userId: 123
}
```

### Rate Limit Statistics

```bash
# Get rate limit stats
curl http://localhost:3000/api/admin/rate-limit

# Reset specific rate limit
curl -X DELETE "http://localhost:3000/api/admin/rate-limit?identifier=device_abc123&type=api"
```

## 🎯 Usage Examples

### Manual Rate Limit Notification

```typescript
import { sendRateLimitNotification } from '@/lib/sse/utils';

// Send notification to specific user
await sendRateLimitNotification(
  userId,
  {
    retryAfter: 120,
    penaltyLevel: 2,
    quotaType: 'upload',
    retryAfterHuman: '2 minutes'
  },
  false, // not an attack
  '/api/upload'
);
```

### System-wide Broadcast

```typescript
import { broadcastRateLimitNotification } from '@/lib/sse/utils';

// Broadcast to all users
await broadcastRateLimitNotification(
  'System experiencing high load. Please reduce request frequency.',
  false // not an attack
);
```

## 🔮 Future Enhancements

- **User Preferences**: Allow users to configure notification preferences
- **Rate Limit Quotas**: Display remaining quota in banners
- **Historical Tracking**: Track rate limit violations over time
- **Smart Throttling**: Adaptive rate limits based on user behavior
- **Integration Webhooks**: External system notifications for severe violations

---

This integration provides **100% reliable, instant rate limit notifications** with graceful fallbacks and comprehensive security features! 🧙‍♂️⚡
