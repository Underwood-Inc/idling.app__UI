---
title: 'Universal SSE System'
category: 'Real-time Communication'
order: 1
---

# Universal Server-Sent Events (SSE) System 🔄

The Universal SSE System provides a comprehensive, agnostic architecture for real-time server-to-client communication throughout the application. This system enables instant notifications, alerts, toasts, live updates, and custom messaging with enterprise-grade reliability and performance.

## 🏗️ Architecture Overview

### Core Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    Universal SSE Architecture                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│  │   SSE Manager   │◄──►│  Connection     │◄──►│   Channel    │ │
│  │   (Core Logic)  │    │  Management     │    │  Routing     │ │
│  └─────────────────┘    └─────────────────┘    └──────────────┘ │
│           ▲                       ▲                      ▲      │
│           │                       │                      │      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│  │   Caching &     │    │   Targeting &   │    │   Rate       │ │
│  │   Performance   │    │   Filtering     │    │   Limiting   │ │
│  └─────────────────┘    └─────────────────┘    └──────────────┘ │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                        Integration Layer                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│  │   React Hook    │    │   Route         │    │   Utility    │ │
│  │   (useSSE)      │    │   Handlers      │    │   Functions  │ │
│  └─────────────────┘    └─────────────────┘    └──────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Channel-Based Architecture

The system organizes communication through **channels**, each serving specific purposes:

| Channel         | Purpose                                | Examples                               |
| --------------- | -------------------------------------- | -------------------------------------- |
| `alerts`        | Banner alerts and system notifications | Maintenance notices, security alerts   |
| `notifications` | User-specific notifications            | New messages, activity updates         |
| `toasts`        | Temporary feedback messages            | Success confirmations, error messages  |
| `live-updates`  | Real-time data synchronization         | Live dashboards, collaborative editing |
| `admin-actions` | Admin panel real-time updates          | User management, system monitoring     |
| `chat`          | Messaging and communication            | Chat messages, typing indicators       |
| `system`        | System-wide announcements              | Server status, maintenance windows     |
| `custom`        | Application-specific events            | Custom business logic events           |

## 🚀 Quick Start

### 1. Basic Integration

```typescript
import { SSEManager, sendToast, notifyAdmins } from '@/lib/sse';

// Send a toast notification
await sendToast(userId, 'Operation completed successfully!', 'success');

// Notify all admins
await notifyAdmins('update', {
  type: 'user-action',
  message: 'User quota updated',
  userId
});

// Broadcast to all users in a channel
await SSEManager.broadcastToChannel('alerts', 'update', {
  title: 'System Update',
  message: 'New features are now available!'
});
```

### 2. React Component Integration

```tsx
import { useSSE } from '@/lib/sse';

function MyComponent() {
  const {
    connectionState,
    isConnected,
    addEventListener,
    removeEventListener
  } = useSSE('/api/sse/stream', {
    channels: ['notifications', 'toasts'],
    autoConnect: true
  });

  useEffect(() => {
    const handleToast = (data) => {
      showToast(data.message, data.type);
    };

    addEventListener('toast', handleToast);
    return () => removeEventListener('toast', handleToast);
  }, [addEventListener, removeEventListener]);

  return (
    <div>
      <div>Status: {connectionState.status}</div>
      {isConnected && <div>Connected to real-time updates</div>}
    </div>
  );
}
```

### 3. Creating Custom SSE Endpoints

```typescript
// /api/my-custom-sse/route.ts
import { createSSEHandler } from '@/lib/sse/handlers';

export const GET = createSSEHandler({
  channels: ['custom', 'notifications'],
  requireAuth: true,
  allowedRoles: ['premium_user'],
  heartbeatInterval: 15000
});
```

## 📡 Message Types & Events

### Event Types

```typescript
type SSEEventType =
  | 'connected' // Connection established
  | 'heartbeat' // Keep-alive ping
  | 'data' // Generic data event
  | 'update' // Data update event
  | 'refresh' // Refresh/reload request
  | 'toast' // Toast notification
  | 'alert' // Alert/banner message
  | 'notification' // User notification
  | 'broadcast' // System broadcast
  | 'error' // Error event
  | 'custom'; // Custom event type
```

### Message Structure

```typescript
interface SSEMessage {
  id: string; // Unique message identifier
  channel: SSEChannelType; // Target channel
  event: SSEEventType; // Event type
  data: any; // Message payload
  timestamp: number; // Creation timestamp

  // Targeting options
  target: SSETargetType; // Targeting strategy
  targetUsers?: number[]; // Specific user IDs
  targetRoles?: string[]; // Required roles
  targetPermissions?: string[]; // Required permissions

  // Message options
  priority?: number; // Message priority (0-10)
  ttl?: number; // Time to live (seconds)
  persistent?: boolean; // Cache for new connections
  retryable?: boolean; // Allow retry on failure

  // Filtering
  excludeUsers?: number[]; // Users to exclude
  requireAuth?: boolean; // Require authentication
}
```

## 🎯 Targeting & Filtering

### Targeting Strategies

```typescript
// Target all users
await SSEManager.broadcastToChannel('system', 'broadcast', {
  message: 'System maintenance in 5 minutes'
});

// Target specific users
await SSEManager.sendToUsers([123, 456], 'notifications', 'notification', {
  title: 'Personal Message',
  message: 'You have a new message'
});

// Target users with specific roles
await SSEManager.sendMessage({
  channel: 'admin-actions',
  event: 'alert',
  data: { message: 'Security alert detected' },
  target: 'role-based',
  targetRoles: ['admin', 'security_officer']
});

// Target users with permissions
await SSEManager.sendMessage({
  channel: 'notifications',
  event: 'update',
  data: { message: 'New content available for review' },
  target: 'permission-based',
  targetPermissions: ['content.review']
});
```

### Advanced Filtering

```typescript
// Complex targeting with exclusions
await SSEManager.sendMessage({
  channel: 'alerts',
  event: 'alert',
  data: { message: 'Important announcement' },
  target: 'authenticated',
  excludeUsers: [123, 456], // Don't send to these users
  priority: 8,
  persistent: true
});
```

## 🔧 Integration Patterns

### 1. Banner System Integration

The SSE system seamlessly integrates with the existing banner system:

```typescript
// Server-side: Update alerts and notify clients
import { invalidateClientCaches } from '@/lib/sse';

async function updateAlert(alertId: number) {
  // Update alert in database
  await updateAlertInDatabase(alertId);

  // Invalidate client caches and trigger refresh
  await invalidateClientCaches(['alerts'], null); // All users
}
```

```tsx
// Client-side: Banner system automatically receives updates
function BannerSystem() {
  const { alerts } = useSSEAlerts(); // Uses SSE for real-time updates

  return (
    <div>
      {alerts.map((alert) => (
        <Banner key={alert.id} alert={alert} />
      ))}
    </div>
  );
}
```

### 2. Admin Panel Real-time Updates

```typescript
// Server action: Notify admins of user actions
export async function updateUserQuota(userId: number, newQuota: number) {
  // Update quota in database
  await updateQuotaInDatabase(userId, newQuota);

  // Notify all admins in real-time
  await notifyAdmins('update', {
    type: 'quota-updated',
    userId,
    newQuota,
    timestamp: Date.now()
  });

  // Send success toast to the admin who made the change
  await sendToast(currentAdminId, 'Quota updated successfully', 'success');
}
```

### 3. Toast Notification System

```typescript
// Utility function for easy toast sending
export async function showUserToast(
  userId: number,
  message: string,
  type: 'success' | 'error' | 'warning' | 'info' = 'info'
) {
  return sendToast(userId, message, type, {
    duration: 5000,
    dismissible: true
  });
}

// Usage in server actions
export async function processPayment(userId: number) {
  try {
    await processPaymentLogic();
    await showUserToast(userId, 'Payment processed successfully!', 'success');
  } catch (error) {
    await showUserToast(userId, 'Payment failed. Please try again.', 'error');
  }
}
```

### 4. Live Data Updates

```typescript
// Real-time dashboard updates
export async function updateDashboardMetrics(metrics: any) {
  // Update metrics in database
  await saveDashboardMetrics(metrics);

  // Send live updates to all connected dashboard users
  await SSEManager.sendMessage({
    channel: 'live-updates',
    event: 'data',
    data: { type: 'metrics-update', metrics },
    target: 'permission-based',
    targetPermissions: ['dashboard.view']
  });
}
```

## 🛡️ Security & Performance

### Authentication & Authorization

```typescript
// Role-based endpoint
export const GET = createSSEHandler({
  requireAuth: true,
  allowedRoles: ['admin', 'moderator'],
  channels: ['admin-actions']
});

// Permission-based endpoint
export const GET = createSSEHandler({
  requireAuth: true,
  allowedPermissions: ['dashboard.view', 'analytics.read'],
  channels: ['live-updates']
});
```

### Rate Limiting

```typescript
// Built-in rate limiting
export const GET = createSSEHandler({
  rateLimit: {
    maxConnections: 50, // Per IP
    windowMs: 60000 // 1 minute window
  }
});
```

### Performance Optimization

- **Connection Pooling**: Automatic connection management and cleanup
- **Intelligent Caching**: TTL-based message caching with LRU eviction
- **Batch Processing**: Efficient message delivery to multiple recipients
- **Heartbeat Monitoring**: Automatic detection of stale connections
- **Memory Management**: Automatic cleanup of inactive connections

## 📊 Monitoring & Analytics

### System Statistics

```typescript
import { SSEManager } from '@/lib/sse';

// Get real-time system stats
const stats = SSEManager.getSystemStats();
console.log({
  totalConnections: stats.totalConnections,
  activeChannels: stats.activeChannels,
  messagesPerMinute: stats.messagesPerMinute,
  memoryUsage: stats.memoryUsage
});
```

### Connection Debugging

```typescript
// Debug specific connection
const connection = SSEManager.getConnectionInfo('conn-123');
if (connection) {
  console.log({
    userId: connection.userId,
    channels: Array.from(connection.channels),
    connectedAt: connection.connectedAt,
    lastActivity: connection.lastActivity
  });
}
```

## 🔄 Error Handling & Reliability

### Automatic Reconnection

```typescript
const { connectionState, reconnect } = useSSE('/api/sse/stream', {
  reconnectAttempts: 5,
  reconnectDelay: 1000
});

// Manual reconnection
if (connectionState.status === 'error') {
  reconnect();
}
```

### Graceful Degradation

```typescript
// Fallback when SSE is unavailable
try {
  await sendToast(userId, message, 'success');
} catch (error) {
  // Fallback to database notification
  await createDatabaseNotification(userId, message);
}
```

## 🎨 Custom Event Types

### Creating Custom Events

```typescript
// Define custom event types
type CustomEventType = 'user-online' | 'typing-indicator' | 'file-uploaded';

// Send custom events
await SSEManager.sendMessage({
  channel: 'custom',
  event: 'custom',
  data: {
    customType: 'user-online',
    userId: 123,
    status: 'online'
  },
  target: 'user-specific',
  targetUsers: [456, 789] // Notify specific users
});
```

### Custom Channel Handlers

```typescript
// Create specialized handlers for different use cases
export const createChatHandler = () =>
  createSSEHandler({
    channels: ['chat'],
    requireAuth: true,
    heartbeatInterval: 10000, // More frequent for chat
    connectionTimeout: 600000 // 10 minutes for chat sessions
  });

export const createAnalyticsHandler = () =>
  createSSEHandler({
    channels: ['live-updates'],
    requireAuth: true,
    allowedPermissions: ['analytics.view'],
    heartbeatInterval: 30000
  });
```

## 🧪 Testing

### Unit Testing SSE Components

```typescript
import { SSEManager } from '@/lib/sse';

describe('SSE System', () => {
  test('should send message to specific users', async () => {
    const result = await SSEManager.sendToUsers(
      [123],
      'notifications',
      'notification',
      { message: 'Test' }
    );

    expect(result.sent).toBeGreaterThan(0);
  });

  test('should filter by roles correctly', async () => {
    const result = await SSEManager.sendMessage({
      channel: 'admin-actions',
      event: 'alert',
      data: { message: 'Admin alert' },
      target: 'role-based',
      targetRoles: ['admin']
    });

    expect(result.sent).toBeGreaterThanOrEqual(0);
  });
});
```

### Integration Testing

```typescript
// Test real-time updates in components
import { render, waitFor } from '@testing-library/react';
import { useSSE } from '@/lib/sse';

test('should receive real-time updates', async () => {
  const TestComponent = () => {
    const { addEventListener } = useSSE('/api/sse/stream');
    const [message, setMessage] = useState('');

    useEffect(() => {
      addEventListener('toast', (data) => setMessage(data.message));
    }, [addEventListener]);

    return <div>{message}</div>;
  };

  const { getByText } = render(<TestComponent />);

  // Simulate SSE message
  await sendToast(123, 'Test message', 'info');

  await waitFor(() => {
    expect(getByText('Test message')).toBeInTheDocument();
  });
});
```

## 🚀 Best Practices

### 1. Channel Organization

- Use specific channels for different types of messages
- Avoid mixing unrelated message types in the same channel
- Consider user permissions when designing channels

### 2. Message Design

- Keep message payloads small and focused
- Use consistent data structures across similar messages
- Include necessary metadata for client-side processing

### 3. Error Handling

- Always handle SSE failures gracefully
- Implement fallback mechanisms for critical notifications
- Log SSE errors for monitoring and debugging

### 4. Performance

- Use appropriate targeting to minimize unnecessary messages
- Implement rate limiting for high-frequency events
- Monitor connection counts and system resources

### 5. Security

- Always validate user permissions before sending sensitive data
- Use authentication for channels containing personal information
- Implement proper rate limiting to prevent abuse

## 📚 Examples

### Complete Integration Example

```typescript
// /api/admin/users/[id]/update-status/route.ts
import { notifyAdmins, sendToast, triggerRefresh } from '@/lib/sse';

export async function PATCH(request: NextRequest, { params }) {
  try {
    const { id } = params;
    const { status, reason } = await request.json();

    // Update user status in database
    await updateUserStatus(id, status);

    // Real-time notifications
    await Promise.all([
      // Notify all admins
      notifyAdmins('update', {
        type: 'user-status-changed',
        userId: id,
        newStatus: status,
        reason
      }),

      // Send toast to current admin
      sendToast(currentAdminId, 'User status updated successfully', 'success'),

      // Trigger refresh of user list in admin panel
      triggerRefresh('user-list', {
        channel: 'admin-actions',
        reason: 'user_status_update'
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    await sendToast(currentAdminId, 'Failed to update user status', 'error');
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
```

This comprehensive SSE system provides a robust foundation for real-time communication throughout your application, with built-in security, performance optimization, and extensive customization options. 🎯
