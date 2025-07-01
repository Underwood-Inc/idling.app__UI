# Quota System Architecture 🧙‍♂️

## Overview

The quota system provides comprehensive usage tracking and limits for both authenticated users and anonymous guests across all services in the application. It supports feature-level granularity with proper hierarchy handling.

## Architecture Components

### 1. Database Tables

#### Core Tables

- **`subscription_services`** - Defines available services (og_generator, custom_emoji, etc.)
- **`subscription_features`** - Defines features within each service (daily_generations, emoji_slots, etc.)
- **`subscription_usage`** - Tracks daily usage for authenticated users
- **`user_subscriptions`** - User subscription assignments and status

#### Quota Management Tables

- **`global_guest_quotas`** - Global quota settings for anonymous users
- **`guest_usage_tracking`** - Usage tracking for anonymous users by IP/fingerprint
- **`user_quota_overrides`** - Admin-configured quota overrides for specific users

### 2. Database Functions

#### Core Functions

- **`get_user_usage(user_id, service_name, feature_name, reset_period)`** - Gets current usage for authenticated users
- **`record_feature_usage(user_id, service_name, feature_name, usage_count, metadata)`** - Records usage for authenticated users
- **`get_guest_usage(client_ip, service_name, feature_name, machine_fingerprint, reset_period)`** - Gets current usage for guests

#### Comprehensive Functions

- **`check_user_quota_comprehensive(user_id, service_name, feature_name)`** - Complete quota checking for users
- **`check_guest_quota_comprehensive(client_ip, service_name, feature_name, machine_fingerprint)`** - Complete quota checking for guests

### 3. Server Actions (`src/lib/actions/quota.actions.ts`)

The quota system uses Next.js server actions for proper server-side execution:

- **`checkUserQuota(userId, serviceName, featureName)`** - Check quota for authenticated users
- **`checkGuestQuota(guestIdentity, serviceName, featureName)`** - Check quota for anonymous guests
- **`recordUserUsage(userId, serviceName, featureName, usageCount, metadata)`** - Record usage for authenticated users
- **`recordGuestUsage(guestIdentity, serviceName, featureName, usageCount, metadata)`** - Record usage for anonymous guests

## Quota Priority Hierarchy

The system follows a strict priority order for determining quotas:

1. **User-specific overrides** (highest priority) - Admin-configured overrides
2. **Subscription plan quotas** - Based on user's active subscription
3. **Global guest quotas** (for anonymous users) - System-wide guest limits
4. **System defaults** (fallback) - Hardcoded fallback values

## Usage Flow

### For Authenticated Users

1. **Check Quota**: Call `checkUserQuota(userId, serviceName, featureName)`
2. **Validate**: Ensure `quotaCheck.allowed` is `true`
3. **Perform Action**: Execute the requested operation
4. **Record Usage**: Call `recordUserUsage(userId, serviceName, featureName, 1, metadata)`

### For Anonymous Guests

1. **Generate Identity**: Create `GuestIdentity` object with IP, fingerprint, user agent hash
2. **Check Quota**: Call `checkGuestQuota(guestIdentity, serviceName, featureName)`
3. **Validate**: Ensure `quotaCheck.allowed` is `true`
4. **Perform Action**: Execute the requested operation
5. **Record Usage**: Call `recordGuestUsage(guestIdentity, serviceName, featureName, 1, metadata)`

## Integration Example

```typescript
// In OGImageService.generateImage()

// Check quota
const quotaCheck = userId
  ? await checkUserQuota(parseInt(userId), 'og_generator', 'daily_generations')
  : await checkGuestQuota(guestIdentity, 'og_generator', 'daily_generations');

if (!quotaCheck.allowed) {
  throw new Error(`Quota exceeded: ${quotaCheck.message}`);
}

// ... perform generation ...

// Record usage
const usageRecord = userId
  ? await recordUserUsage(
      parseInt(userId),
      'og_generator',
      'daily_generations',
      1,
      metadata
    )
  : await recordGuestUsage(
      guestIdentity,
      'og_generator',
      'daily_generations',
      1,
      metadata
    );
```

## Recent Fixes (Migration 0033)

### Issues Resolved

1. **Missing Database Function**: Added `get_user_usage()` function that was referenced in code but missing from database
2. **Dead Code Removal**: Removed duplicate `EnhancedQuotaService` and `EdgeQuotaService` classes
3. **Function Dependencies**: Ensured all required helper functions (`update_updated_at_column`) exist
4. **Performance Indexes**: Added missing indexes for subscription_usage table queries
5. **Comprehensive Functions**: Added new comprehensive quota checking functions for better performance

### Database Schema Validation

The migration includes automatic validation to ensure all required tables and columns exist:

- `subscription_usage` table with `usage_date` column
- `global_guest_quotas` table
- `user_quota_overrides` table

## Configuration

### Service Configuration

Services are configured in the `subscription_services` table:

```sql
INSERT INTO subscription_services (name, display_name, category) VALUES
('og_generator', 'OG Image Generator', 'core'),
('custom_emoji', 'Custom Emoji System', 'premium'),
('api_access', 'API Access', 'enterprise');
```

### Feature Configuration

Features are configured in the `subscription_features` table:

```sql
INSERT INTO subscription_features (service_id, name, display_name, feature_type, default_value) VALUES
((SELECT id FROM subscription_services WHERE name = 'og_generator'), 'daily_generations', 'Daily Generations', 'limit', '1'),
((SELECT id FROM subscription_services WHERE name = 'custom_emoji'), 'emoji_slots', 'Custom Emoji Slots', 'limit', '0');
```

### Global Guest Quotas

Configure default quotas for anonymous users:

```sql
INSERT INTO global_guest_quotas (service_name, feature_name, quota_limit, reset_period) VALUES
('og_generator', 'daily_generations', 1, 'daily'),
('api_access', 'api_requests', 100, 'hourly');
```

## Monitoring and Administration

### Admin API Endpoints

- `GET /api/admin/users/[id]/quotas` - View user quota information
- `PATCH /api/admin/users/[id]/quotas` - Update user quota overrides
- `POST /api/admin/users/[id]/quotas/reset` - Reset user quota usage

### Usage Analytics

The system tracks comprehensive metadata for usage analytics:

- IP addresses and user agents for guests
- Generation configurations and parameters
- Timestamps and reset periods
- Quota sources and limits

## Security Considerations

1. **Guest Tracking**: Uses IP + machine fingerprinting for anonymous users while preserving privacy
2. **Server Actions**: All quota operations run server-side to prevent client manipulation
3. **Admin Controls**: Quota overrides require admin permissions and are logged
4. **Rate Limiting**: Multiple reset periods supported (hourly, daily, weekly, monthly)

## Performance Optimizations

1. **Indexed Queries**: All quota lookup queries use optimized indexes
2. **Efficient Aggregation**: Usage calculations use database-level SUM operations
3. **Caching Ready**: Functions are marked as STABLE for potential query plan caching
4. **Batch Operations**: Support for recording multiple usage units in single call

---

_This documentation reflects the current state after Migration 0033 fixes. The quota system is now fully functional and ready for production use._ ✨
