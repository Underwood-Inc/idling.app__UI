---
title: 'SSE + Banner System Integration'
category: 'Real-time Communication'
order: 2
---

# SSE + Banner System Integration 🔔

This document details how the Universal SSE System integrates with the banner/alert system to provide real-time notifications and alerts throughout the application.

## 🏗️ Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SSE + Banner Integration                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│  │   Admin Panel   │────│   SSE Manager   │────│   Banner     │ │
│  │   (Alert CRUD)  │    │   (Real-time)   │    │   System     │ │
│  └─────────────────┘    └─────────────────┘    └──────────────┘ │
│           │                       │                      │      │
│           ▼                       ▼                      ▼      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│  │   Database      │    │   Cache         │    │   Client     │ │
│  │   Updates       │    │   Invalidation  │    │   Updates    │ │
│  └─────────────────┘    └─────────────────┘    └──────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Real-time Flow

### 1. Alert Creation/Update Flow

```typescript
// Admin creates/updates an alert
async function updateAlert(alertData: AlertData) {
  // 1. Update database
  await sql`UPDATE custom_alerts SET ... WHERE id = ${alertId}`;

  // 2. Clear SSE cache
  await clearAllAlertCaches();

  // 3. Notify all connected clients
  await SSEManager.broadcastToChannel('alerts', 'refresh', {
    reason: 'admin_update',
    timestamp: Date.now()
  });

  // 4. Send admin notification
  await notifyAdmins('update', {
    type: 'alert-updated',
    alertId,
    action: 'updated'
  });
}
```

### 2. Client-side Real-time Updates

```tsx
// Banner system automatically receives updates
function BannerSystem() {
  const { alerts, connectionState } = useSSEAlerts();
  const [banners, setBanners] = useState<Banner[]>([]);

  // Convert SSE alerts to banner format
  useEffect(() => {
    const convertedBanners = alerts.map((alert) => ({
      id: alert.id.toString(),
      type: alert.alert_type as BannerType,
      title: alert.title,
      message: alert.message,
      dismissible: alert.dismissible,
      persistent: alert.persistent,
      priority: alert.priority,
      actions: alert.actions,
      expiresAt: alert.expires_at ? new Date(alert.expires_at) : undefined
    }));

    setBanners(convertedBanners);
  }, [alerts]);

  return (
    <div className="banner-container">
      <SSEConnectionIndicator connectionState={connectionState} />
      {banners.map((banner) => (
        <Banner key={banner.id} {...banner} />
      ))}
    </div>
  );
}
```

## 📡 SSE Alert Events

### Event Types

| Event            | Description                | Payload                               |
| ---------------- | -------------------------- | ------------------------------------- |
| `connected`      | SSE connection established | `{ userId, timestamp, cacheEnabled }` |
| `alerts`         | Initial alert data         | `SSEAlert[]`                          |
| `alerts-update`  | Alert data changed         | `SSEAlert[]`                          |
| `alerts-refresh` | Force refresh request      | `{ reason, timestamp }`               |
| `heartbeat`      | Connection keep-alive      | `{ timestamp, status }`               |
| `error`          | Connection/data error      | `{ error, code, retryCount }`         |

### Alert Data Structure

```typescript
interface SSEAlert {
  id: number;
  title: string;
  message?: string;
  details?: string;
  alert_type: string; // 'info' | 'warning' | 'error' | 'success'
  priority: number; // 0-10 priority level
  icon?: string; // Optional icon identifier
  dismissible: boolean; // Can user dismiss this alert?
  persistent: boolean; // Survives page refreshes?
  expires_at?: string; // ISO timestamp for expiration
  actions?: any; // Action buttons/links
  metadata?: any; // Additional data
}
```

## 🎯 Targeting & Personalization

### User-Specific Alerts

```typescript
// Send alert to specific users
await SSEManager.sendToUsers([123, 456], 'alerts', 'alert', {
  id: Date.now(),
  title: 'Personal Alert',
  message: 'This message is just for you',
  alert_type: 'info',
  priority: 5,
  dismissible: true,
  persistent: false
});
```

### Role-Based Alerts

```typescript
// Alert only admins about system issues
await SSEManager.sendMessage({
  channel: 'alerts',
  event: 'alert',
  data: {
    id: Date.now(),
    title: 'System Alert',
    message: 'Database performance issue detected',
    alert_type: 'warning',
    priority: 8,
    dismissible: false,
    persistent: true
  },
  target: 'role-based',
  targetRoles: ['admin', 'moderator']
});
```

### Subscription-Based Alerts

```typescript
// Alert only subscribers about premium features
await SSEManager.sendMessage({
  channel: 'alerts',
  event: 'alert',
  data: {
    id: Date.now(),
    title: 'New Premium Feature',
    message: 'Advanced analytics now available!',
    alert_type: 'success',
    priority: 6,
    dismissible: true,
    persistent: false
  },
  target: 'subscribers'
});
```

## 🔧 Configuration & Customization

### SSE Configuration

```typescript
// useSSEAlerts hook configuration
const SSE_CONFIG = {
  endpoint: '/api/sse/stream', // Universal SSE endpoint
  maxRetryAttempts: 5, // Connection retry limit
  baseRetryDelay: 1000, // Initial retry delay (ms)
  maxRetryDelay: 30000, // Maximum retry delay (ms)
  heartbeatTimeout: 45000, // Heartbeat timeout (ms)
  reconnectOnVisibilityChange: true, // Reconnect when tab becomes visible
  debugMode: process.env.NODE_ENV === 'development'
};
```

### Banner System Configuration

```typescript
// Banner display configuration
const BANNER_CONFIG = {
  maxVisible: 3, // Maximum banners shown at once
  defaultDuration: 5000, // Default auto-dismiss time (ms)
  animationDuration: 300, // Animation timing (ms)
  stackDirection: 'top', // 'top' | 'bottom'
  position: 'top-center', // Banner positioning
  enableSounds: false, // Audio notifications
  persistentStorage: true // Remember dismissed banners
};
```

## 🛠️ Admin Panel Integration

### Real-time Alert Management

```tsx
// Admin alert management with live updates
function AdminAlertPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const { addEventListener } = useSSE('/api/admin/sse/stream', {
    channels: ['admin-actions'],
    requireAuth: true
  });

  useEffect(() => {
    // Listen for alert changes from other admins
    addEventListener('update', (data) => {
      if (data.type === 'alert-updated') {
        // Refresh alert list
        loadAlerts();

        // Show notification
        toast.info(`Alert ${data.alertId} was updated by another admin`);
      }
    });
  }, [addEventListener]);

  const handleCreateAlert = async (alertData: AlertData) => {
    try {
      await createAlert(alertData);

      // Success toast will be sent via SSE
      // No need for manual toast here
    } catch (error) {
      toast.error('Failed to create alert');
    }
  };

  return (
    <div>
      <AlertForm onSubmit={handleCreateAlert} />
      <AlertList alerts={alerts} />
    </div>
  );
}
```

### Cache Management

```typescript
// Server-side cache invalidation
import {
  clearAllAlertCaches,
  notifyAlertUpdate
} from '@/app/api/alerts/stream/route';

// After alert CRUD operations
export async function POST(request: NextRequest) {
  try {
    // Create alert in database
    const alert = await createAlertInDatabase(alertData);

    // Clear all alert caches
    clearAllAlertCaches();

    // Notify all connected clients
    notifyAlertUpdate(); // Broadcasts to all users

    return NextResponse.json({ success: true, alert });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create alert' },
      { status: 500 }
    );
  }
}
```

## 🎨 Custom Alert Types

### Creating Custom Alert Components

```tsx
// Custom alert types with specific behaviors
interface CustomAlert extends SSEAlert {
  customType: 'maintenance' | 'feature-announcement' | 'security-notice';
  customData: {
    scheduledTime?: string;
    affectedServices?: string[];
    actionRequired?: boolean;
  };
}

function CustomBanner({ alert }: { alert: CustomAlert }) {
  const renderCustomContent = () => {
    switch (alert.customType) {
      case 'maintenance':
        return (
          <MaintenanceBanner
            scheduledTime={alert.customData.scheduledTime}
            affectedServices={alert.customData.affectedServices}
          />
        );

      case 'feature-announcement':
        return <FeatureAnnouncementBanner alert={alert} />;

      case 'security-notice':
        return (
          <SecurityNoticeBanner
            actionRequired={alert.customData.actionRequired}
          />
        );

      default:
        return <StandardBanner alert={alert} />;
    }
  };

  return (
    <div className={`custom-banner custom-banner--${alert.customType}`}>
      {renderCustomContent()}
    </div>
  );
}
```

### Sending Custom Alerts

```typescript
// Send maintenance notification
export async function scheduleMaintenanceAlert(
  scheduledTime: Date,
  duration: number,
  affectedServices: string[]
) {
  await SSEManager.broadcastToChannel('alerts', 'alert', {
    id: Date.now(),
    title: 'Scheduled Maintenance',
    message: `System maintenance scheduled for ${scheduledTime.toLocaleString()}`,
    alert_type: 'warning',
    priority: 8,
    dismissible: false,
    persistent: true,
    customType: 'maintenance',
    customData: {
      scheduledTime: scheduledTime.toISOString(),
      affectedServices,
      duration
    }
  });
}
```

## 📊 Performance & Monitoring

### Connection Monitoring

```tsx
// Connection status indicator
function SSEConnectionIndicator({
  connectionState
}: {
  connectionState: SSEConnectionState;
}) {
  const getStatusColor = () => {
    switch (connectionState.status) {
      case 'connected':
        return 'green';
      case 'connecting':
        return 'yellow';
      case 'reconnecting':
        return 'orange';
      case 'error':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getStatusText = () => {
    switch (connectionState.status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'reconnecting':
        return `Reconnecting (${connectionState.retryCount}/${5})`;
      case 'error':
        return 'Connection Error';
      default:
        return 'Disconnected';
    }
  };

  // Only show indicator when there are issues or in development
  if (
    connectionState.status === 'connected' &&
    process.env.NODE_ENV === 'production'
  ) {
    return null;
  }

  return (
    <div className={`sse-indicator sse-indicator--${connectionState.status}`}>
      <span
        className="status-dot"
        style={{ backgroundColor: getStatusColor() }}
      />
      <span className="status-text">{getStatusText()}</span>
      {connectionState.lastError && (
        <span className="error-text">{connectionState.lastError}</span>
      )}
    </div>
  );
}
```

### Performance Metrics

```typescript
// Monitor SSE performance
import { SSEManager } from '@/lib/sse';

export async function getSSEMetrics() {
  const stats = SSEManager.getSystemStats();

  return {
    totalConnections: stats.totalConnections,
    activeChannels: stats.activeChannels,
    messagesPerMinute: stats.messagesPerMinute,
    cacheSize: stats.cacheSize,
    uptime: stats.uptime,
    memoryUsage: stats.memoryUsage,
    channels: stats.channels.map((channel) => ({
      name: channel.channel,
      connections: channel.activeConnections,
      messagesPerMinute: channel.messagesPerMinute
    }))
  };
}
```

## 🔍 Debugging & Troubleshooting

### Debug Mode

```typescript
// Enable debug logging in development
const SSE_CONFIG = {
  debugMode: process.env.NODE_ENV === 'development'
};

// Debug logs will show:
// - Connection events
// - Message sending/receiving
// - Cache operations
// - Error conditions
```

### Common Issues & Solutions

| Issue               | Cause                 | Solution                           |
| ------------------- | --------------------- | ---------------------------------- |
| Alerts not updating | SSE connection failed | Check network, retry connection    |
| Duplicate alerts    | Multiple connections  | Implement connection deduplication |
| Missing alerts      | Cache not invalidated | Force cache refresh                |
| Slow updates        | Database performance  | Optimize alert queries             |
| Connection drops    | Network instability   | Increase retry attempts            |

### Testing SSE Integration

```typescript
// Test SSE alert delivery
describe('SSE Alert Integration', () => {
  test('should deliver alerts in real-time', async () => {
    const mockConnection = createMockSSEConnection();
    SSEManager.registerConnection(mockConnection);

    // Send alert
    await SSEManager.broadcastToChannel('alerts', 'alert', {
      id: 1,
      title: 'Test Alert',
      alert_type: 'info'
    });

    // Verify delivery
    expect(mockConnection.sendEvent).toHaveBeenCalledWith(
      'alert',
      expect.objectContaining({
        title: 'Test Alert'
      })
    );
  });

  test('should handle connection failures gracefully', async () => {
    const failingConnection = createFailingSSEConnection();
    SSEManager.registerConnection(failingConnection);

    const result = await SSEManager.sendToUsers([123], 'alerts', 'alert', {
      title: 'Test'
    });

    expect(result.failed).toBe(1);
    expect(result.sent).toBe(0);
  });
});
```

## 🚀 Best Practices

### 1. Alert Design

- Keep alert messages concise and actionable
- Use appropriate priority levels (0-10)
- Include clear call-to-action buttons when needed
- Consider user context and permissions

### 2. Performance

- Use targeted messaging to reduce unnecessary traffic
- Implement proper caching strategies
- Monitor connection counts and resource usage
- Clean up expired alerts regularly

### 3. User Experience

- Provide clear connection status indicators
- Implement graceful degradation for SSE failures
- Allow users to control notification preferences
- Test across different network conditions

### 4. Security

- Validate user permissions before sending alerts
- Sanitize alert content to prevent XSS
- Use HTTPS for all SSE connections
- Implement rate limiting to prevent abuse

This integration provides a seamless, real-time experience for banner alerts while maintaining backward compatibility and robust error handling. 🎯
