# Rate Limit + SSE Integration Testing Guide

## 🧙‍♂️ Quick Browser Console Test

The easiest way to test the rate limit notifications is to open your browser's developer console on any page of the app and run these commands:

### Test SSE Connection Status

```javascript
// Check if SSE client is connected
if (window.__SSE_DEBUG) {
  console.log('🔍 SSE Debug Info:', window.__SSE_DEBUG());
} else {
  console.log(
    "❌ SSE client not found - make sure you're on a page with the BannerSystem component"
  );
}
```

### Test Rate Limit Notification (Normal)

```javascript
fetch('/api/admin/test-rate-limit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ testType: 'normal' })
})
  .then((r) => r.json())
  .then((result) => {
    console.log('✅ Rate limit test result:', result);
    if (result.success) {
      console.log('🚨 Check for banner notification in 1-2 seconds!');
    }
  })
  .catch((err) => console.error('❌ Test failed:', err));
```

### Test Attack Notification (Security Alert)

```javascript
fetch('/api/admin/test-rate-limit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ testType: 'attack' })
})
  .then((r) => r.json())
  .then((result) => {
    console.log('🛡️ Security test result:', result);
    if (result.success) {
      console.log('🚨 Check for red security banner in 1-2 seconds!');
    }
  })
  .catch((err) => console.error('❌ Test failed:', err));
```

### Trigger Multiple Requests (Rate Limit Simulation)

```javascript
// Simulate rapid requests to trigger actual rate limiting
for (let i = 0; i < 5; i++) {
  setTimeout(() => {
    fetch('/api/test/health').then((r) =>
      console.log(`Request ${i + 1}: ${r.status}`)
    );
  }, i * 100);
}
```

## 🧪 HTML Test Tool

For more comprehensive testing, use the standalone HTML test tool:

1. Open `test-sse-rate-limit.html` in your browser
2. The tool will auto-connect to the SSE endpoint
3. Use the buttons to test different scenarios
4. Watch the logs for real-time feedback

## 📊 Expected Behaviors

### ✅ Normal Rate Limit Notification

- **Trigger**: POST to `/api/admin/test-rate-limit` with `{ "testType": "normal" }`
- **Expected**: Yellow/orange banner with "Rate Limit Exceeded" title
- **Content**: "Too many requests. Please slow down." with countdown timer
- **Dismissible**: Yes
- **Priority**: 90

### 🛡️ Attack Notification (Security Alert)

- **Trigger**: POST to `/api/admin/test-rate-limit` with `{ "testType": "attack" }`
- **Expected**: Red banner with "Security Alert" title
- **Content**: "Suspicious activity detected. Access temporarily restricted."
- **Dismissible**: Yes
- **Priority**: 95 (appears above normal alerts)

### 💓 SSE Connection Health

- **Connected Event**: Sent immediately when SSE connects
- **Heartbeat**: Sent every 30 seconds to keep connection alive
- **Alerts**: Database alerts sent on initial connection
- **Reconnection**: Automatic with exponential backoff if connection drops

## 🔧 Troubleshooting

### Connection Issues

If SSE connections keep timing out:

1. **Check Server Logs**: Look for SSE connection errors
2. **Verify Heartbeat**: Should see heartbeat events every 30 seconds
3. **Browser Network Tab**: Check if `/api/sse/stream` stays connected
4. **Console Errors**: Look for SSE parsing or validation errors

### Rate Limit Notifications Not Appearing

1. **Authentication**: Ensure you're logged in (test endpoint requires auth)
2. **SSE Connection**: Verify SSE client is connected and listening for 'alert' events
3. **Banner System**: Ensure BannerSystem component is mounted on the page
4. **Console Logs**: Check for SSE event reception in browser console

### Common Error Messages

- `"Authentication required"`: You need to be logged in to use the test endpoint
- `"Connection timeout"`: SSE connection lost - should auto-reconnect
- `"Parse errors"`: SSE message format issue - check server-side event formatting

## 🐛 Debug Commands

### Enable SSE Debug Logging

```javascript
// Enable verbose SSE logging (if debug mode is available)
localStorage.setItem('sse-debug', 'true');
location.reload();
```

### Check Banner System State

```javascript
// If using React DevTools, you can inspect the BannerSystem component state
// Look for: banners, connectionState, isConnected, sseAlerts
```

### Manual SSE Connection Test

```javascript
// Create a direct SSE connection for testing
const sse = new EventSource('/api/sse/stream');
sse.onopen = () => console.log('✅ Direct SSE connected');
sse.onerror = (e) => console.error('❌ Direct SSE error:', e);
sse.addEventListener('alert', (e) => console.log('🚨 Direct alert:', e.data));
sse.addEventListener('connected', (e) =>
  console.log('🔗 Direct connected:', e.data)
);
sse.addEventListener('heartbeat', (e) =>
  console.log('💓 Direct heartbeat:', e.data)
);

// Close after testing
// sse.close();
```

## 📈 Performance Notes

- **SSE Connection**: Single persistent connection per browser tab
- **Heartbeat Overhead**: ~50 bytes every 30 seconds
- **Rate Limit Notifications**: Instant delivery (0ms delay)
- **Fallback**: Anonymous users fall back to sessionStorage polling
- **Memory Usage**: Minimal - events are processed immediately and not stored

---

## 🚀 Integration Status

- ✅ **Middleware Integration**: Rate limiting triggers SSE notifications
- ✅ **Multi-layer Support**: Device, network, and user-level rate limiting
- ✅ **Real-time Delivery**: Instant notifications via persistent SSE connection
- ✅ **Banner Display**: Rate limit notifications appear as dismissible banners
- ✅ **Fallback Support**: SessionStorage polling for anonymous users
- ✅ **Security Alerts**: Special handling for attack-level violations
- ✅ **Connection Resilience**: Auto-reconnection with exponential backoff
- ✅ **Performance Optimized**: Efficient event parsing and delivery

The rate limit + SSE integration is **fully operational** and ready for production use! 🎉
