---
layout: page
title: 'Admin Guide'
permalink: /admin-guide/
---

# Administrator Guide

This guide is for system administrators who need to monitor, manage, and troubleshoot the rate limiting system. It covers both the technical implementation and practical management strategies.

## 🎛️ Admin Dashboard Access

### Monitoring Endpoint

**URL**: `/api/admin/rate-limit`  
**Method**: GET  
**Authentication**: Admin credentials required

**Response Format**:

```json
{
  "success": true,
  "stats": {
    "totalEntries": 150,
    "activeBackoffs": 5,
    "highPenaltyEntries": 2,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### Management Endpoint

**URL**: `/api/admin/rate-limit`  
**Method**: DELETE  
**Parameters**:

- `identifier`: IP address or user identifier to reset
- `type`: Rate limit type (api, auth, upload, search, admin)

**Example**:

```bash
DELETE /api/admin/rate-limit?identifier=192.168.1.100&type=api
```

## 📊 Understanding the Statistics

### Key Metrics

**Total Entries**

- Number of tracked IP addresses and users
- Normal range: 50-500 depending on site traffic
- High numbers indicate busy periods or potential issues

**Active Backoffs**

- Users currently in rate limit timeout
- Normal range: 0-10 for typical usage
- High numbers suggest widespread issues or attacks

**High Penalty Entries**

- Users with penalty level 3+ (potential problem users)
- Normal range: 0-5 for healthy system
- High numbers indicate abuse patterns or system bugs

### Warning Thresholds

| Metric          | Green | Yellow    | Red   |
| --------------- | ----- | --------- | ----- |
| Active Backoffs | 0-10  | 11-25     | 26+   |
| High Penalty    | 0-5   | 6-15      | 16+   |
| Total Entries   | <1000 | 1000-2000 | 2000+ |

## 🚨 Common Admin Scenarios

### Scenario 1: User Reports False Positive

**Symptoms**: User claims rate limiting during normal use  
**Investigation**:

1. Check user's recent activity patterns
2. Look for unusual IP or device changes
3. Review error logs for that user
4. Check for browser/network issues

**Resolution**:

```bash
# Reset user's rate limit
DELETE /api/admin/rate-limit?identifier=user:12345&type=api
```

### Scenario 2: Suspected Attack

**Symptoms**: High number of active backoffs from similar IPs  
**Investigation**:

1. Check IP address patterns
2. Review penalty levels
3. Look for coordinated activity
4. Check system performance

**Resolution**:

- Monitor but don't intervene immediately
- Document patterns for security team
- Consider temporary IP blocking if severe

### Scenario 3: System Performance Issues

**Symptoms**: Many users hitting rate limits simultaneously  
**Investigation**:

1. Check server resource usage
2. Review database performance
3. Look for recent code deployments
4. Check for external factors (traffic spikes)

**Resolution**:

- Address underlying performance issues
- Consider temporarily raising limits
- Communicate with users about known issues

### Scenario 4: Bug in Frontend

**Symptoms**: Specific user actions consistently trigger limits  
**Investigation**:

1. Reproduce the user's actions
2. Check browser network tab for duplicate requests
3. Review recent frontend changes
4. Test with different browsers/devices

**Resolution**:

- Fix the frontend bug causing extra requests
- Reset affected users' rate limits
- Monitor for improvement

## 🔧 Management Commands

### Monitoring Commands

**Get Current Stats**:

```bash
curl -H "Authorization: Bearer <admin-token>" \
     https://yoursite.com/api/admin/rate-limit
```

**Reset Specific User**:

```bash
curl -X DELETE \
     -H "Authorization: Bearer <admin-token>" \
     "https://yoursite.com/api/admin/rate-limit?identifier=user:12345&type=api"
```

**Reset IP Address**:

```bash
curl -X DELETE \
     -H "Authorization: Bearer <admin-token>" \
     "https://yoursite.com/api/admin/rate-limit?identifier=192.168.1.100&type=api"
```

### Bulk Operations

For multiple resets, you'll need to make individual API calls or add bulk functionality to the admin endpoint.

## 📈 Rate Limit Configuration

### Current Limits (Configurable in Code)

```javascript
// Standard API requests (per IP)
api: {
  windowMs: 60 * 1000,     // 1 minute
  maxRequests: 100,        // 100 requests per minute
},

// Authentication endpoints (per IP)
auth: {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,          // 10 auth attempts per 15 minutes
},

// Upload endpoints (per user)
upload: {
  windowMs: 60 * 1000,     // 1 minute
  maxRequests: 5,          // 5 uploads per minute
},

// Search/filter endpoints (per IP)
search: {
  windowMs: 60 * 1000,     // 1 minute
  maxRequests: 200,        // 200 searches per minute
},

// Admin endpoints (per user)
admin: {
  windowMs: 60 * 1000,     // 1 minute
  maxRequests: 50,         // 50 admin actions per minute
}
```

### Adjusting Limits

To modify rate limits, update the `CONFIGS` object in `src/lib/utils/rateLimiter.ts`:

```javascript
// Example: Increase upload limit
upload: {
  windowMs: 60 * 1000,     // Keep 1 minute window
  maxRequests: 10,         // Increase from 5 to 10
},
```

**Note**: Changes require application restart.

## 🔍 Troubleshooting Guide

### High Active Backoffs

**Possible Causes**:

- DDoS attack or bot activity
- Frontend bug causing duplicate requests
- Server performance issues
- Network problems causing retries

**Investigation Steps**:

1. Check IP address distribution
2. Review server logs for errors
3. Monitor system resources
4. Check for recent deployments

### Memory Usage Concerns

**Monitoring Memory**:

- Rate limiter automatically cleans up old entries
- Memory usage scales with concurrent users
- Each entry uses ~200 bytes

**If Memory is High**:

- Check for memory leaks in cleanup process
- Consider reducing cleanup interval
- Monitor total entries count

### False Positives

**Common Causes**:

- Shared IP addresses (offices, schools)
- Browser extensions making extra requests
- Slow networks causing request retries
- User behavior that looks like automation

**Solutions**:

- Whitelist known good IP ranges
- Adjust limits for specific endpoints
- Educate users about best practices
- Improve error messages

## 📋 Monitoring Checklist

### Daily Monitoring

- [ ] Check active backoffs count
- [ ] Review high penalty entries
- [ ] Monitor total entries growth
- [ ] Check for unusual IP patterns

### Weekly Review

- [ ] Analyze rate limiting trends
- [ ] Review user feedback about limits
- [ ] Check system performance correlation
- [ ] Update documentation if needed

### Monthly Analysis

- [ ] Review rate limit effectiveness
- [ ] Analyze attack patterns and responses
- [ ] Consider limit adjustments based on usage
- [ ] Update security procedures if needed

## 🚀 Best Practices

### Proactive Management

- Monitor trends, not just current stats
- Set up alerts for unusual patterns
- Regularly review and adjust limits
- Keep documentation updated

### User Communication

- Explain rate limiting in user-friendly terms
- Provide clear error messages
- Offer alternatives for power users
- Be responsive to legitimate complaints

### Security Considerations

- Don't reveal detailed rate limiting logic
- Log suspicious patterns for security review
- Coordinate with security team on responses
- Keep rate limiting separate from other security measures

### Performance Optimization

- Monitor rate limiter's own performance impact
- Consider Redis for distributed deployments
- Optimize cleanup processes
- Balance security with user experience

## 🔧 Advanced Configuration

### Custom Rate Limit Types

To add new rate limit types, update the `CONFIGS` object:

```javascript
// Add new configuration
newFeature: {
  windowMs: 5 * 60 * 1000,  // 5 minutes
  maxRequests: 20,          // 20 requests per 5 minutes
}
```

Then update the `getRateLimitType` function in `requestIdentifier.ts`:

```javascript
if (pathname.includes('new-feature')) {
  return 'newFeature';
}
```

### Whitelist Implementation

For trusted IPs or users that should bypass rate limiting:

```javascript
// In middleware.ts, before rate limiting check
const trustedIPs = ['192.168.1.100', '10.0.0.50'];
if (trustedIPs.includes(identifier.ip)) {
  return NextResponse.next();
}
```

### Integration with External Systems

**Logging Integration**:

```javascript
// Send rate limit events to logging service
if (rateLimitResult.penaltyLevel >= 3) {
  await logToSecuritySystem({
    event: 'high_penalty_rate_limit',
    identifier: identifier.composite,
    endpoint: nextUrl.pathname
  });
}
```

**Metrics Integration**:

```javascript
// Send metrics to monitoring service
await sendMetric('rate_limit.active_backoffs', stats.activeBackoffs);
await sendMetric('rate_limit.high_penalty', stats.highPenaltyEntries);
```

---

## Emergency Procedures

### System Under Attack

1. **Immediate**: Monitor rate limiting effectiveness
2. **Short-term**: Consider temporarily stricter limits
3. **Medium-term**: Analyze attack patterns
4. **Long-term**: Improve detection and response

### Rate Limiter Malfunction

1. **Immediate**: Check system logs and metrics
2. **If needed**: Temporarily disable rate limiting
3. **Investigation**: Identify root cause
4. **Resolution**: Fix issue and re-enable with monitoring

### Mass False Positives

1. **Immediate**: Reset affected users
2. **Communication**: Notify users of known issue
3. **Investigation**: Identify cause (bug, config, etc.)
4. **Prevention**: Implement fix and monitoring

---

_This guide should be updated whenever rate limiting configuration or procedures change. Keep it accessible to all administrators who may need to manage the system._
