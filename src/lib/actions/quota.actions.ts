'use server';

import sql from '@/lib/db';

// ================================
// TYPES
// ================================

export interface QuotaCheck {
  allowed: boolean;
  quota_limit: number;
  current_usage: number;
  remaining: number;
  reset_date: Date | null;
  reset_period: string;
  is_unlimited: boolean;
  quota_source: 'user_override' | 'subscription_plan' | 'global_guest' | 'system_default';
  message?: string;
}

export interface UsageRecord {
  success: boolean;
  new_usage_count: number;
  quota_limit: number;
  remaining: number;
  message?: string;
}

interface GuestIdentity {
  client_ip: string;
  machine_fingerprint?: string;
  user_agent_hash?: string;
}

// ================================
// SERVER ACTIONS
// ================================

/**
 * Check quota for guest users
 */
export async function checkGuestQuota(
  guestIdentity: GuestIdentity,
  serviceName: string,
  featureName: string
): Promise<QuotaCheck> {
  try {
    // 1. Check for global guest quota
    const globalQuota = await sql`
      SELECT * FROM global_guest_quotas
      WHERE service_name = ${serviceName}
      AND feature_name = ${featureName}
      AND is_active = true
    `;

    if (globalQuota.length > 0) {
      const quota = globalQuota[0];
      const usage = await getGuestUsage(guestIdentity, serviceName, featureName, quota.reset_period);
      return buildQuotaCheck(quota.quota_limit, usage, quota.reset_period, quota.is_unlimited, 'global_guest');
    }

    // 2. Fallback to system default for guests (1 per day)
    const usage = await getGuestUsage(guestIdentity, serviceName, featureName, 'daily');
    return buildQuotaCheck(1, usage, 'daily', false, 'system_default');

  } catch (error) {
    console.error('Error checking guest quota:', error);
    return buildQuotaCheck(0, 0, 'daily', false, 'system_default', 'Error checking quota');
  }
}

/**
 * Record usage for guest users
 */
export async function recordGuestUsage(
  guestIdentity: GuestIdentity,
  serviceName: string,
  featureName: string,
  usageCount: number = 1,
  metadata?: any
): Promise<UsageRecord> {
  try {
    // Record in guest_usage_tracking table
    const result = await sql`
      INSERT INTO guest_usage_tracking (
        client_ip, service_name, feature_name, machine_fingerprint, user_agent_hash,
        usage_date, usage_count, metadata
      ) VALUES (
        ${guestIdentity.client_ip}, 
        ${serviceName}, 
        ${featureName}, 
        ${guestIdentity.machine_fingerprint || null},
        ${guestIdentity.user_agent_hash || null},
        CURRENT_DATE, 
        ${usageCount}, 
        ${metadata ? JSON.stringify(metadata) : null}
      )
      ON CONFLICT (client_ip, machine_fingerprint, service_name, feature_name, usage_date)
      DO UPDATE SET 
        usage_count = guest_usage_tracking.usage_count + ${usageCount},
        updated_at = NOW(),
        metadata = COALESCE(${metadata ? JSON.stringify(metadata) : null}, guest_usage_tracking.metadata)
      RETURNING usage_count
    `;

    if (result.length > 0) {
      // Get updated quota info
      const quotaCheck = await checkGuestQuota(guestIdentity, serviceName, featureName);
      return {
        success: true,
        new_usage_count: quotaCheck.current_usage,
        quota_limit: quotaCheck.quota_limit,
        remaining: quotaCheck.remaining,
        message: 'Guest usage recorded successfully'
      };
    }

    return {
      success: false,
      new_usage_count: 0,
      quota_limit: 0,
      remaining: 0,
      message: 'Failed to record guest usage'
    };

  } catch (error) {
    console.error('Error recording guest usage:', error);
    return {
      success: false,
      new_usage_count: 0,
      quota_limit: 0,
      remaining: 0,
      message: 'Error recording guest usage'
    };
  }
}

/**
 * Check quota for authenticated users
 */
export async function checkUserQuota(
  userId: number,
  serviceName: string,
  featureName: string
): Promise<QuotaCheck> {
  try {
    // 1. Check for user-specific override
    const userOverride = await sql`
      SELECT * FROM user_quota_overrides
      WHERE user_id = ${userId} 
      AND service_name = ${serviceName} 
      AND feature_name = ${featureName}
      AND is_active = true
    `;

    if (userOverride.length > 0) {
      const override = userOverride[0];
      const usage = await getUserUsage(userId, serviceName, featureName, override.reset_period);
      return buildQuotaCheck(override.quota_limit, usage, override.reset_period, override.is_unlimited, 'user_override');
    }

    // 2. Check subscription plan quota with proper schema (plan_services doesn't have reset_period)
    const subscriptionQuota = await sql`
      SELECT 
        COALESCE(pfv.feature_value::text::integer, sf.default_value::text::integer, 1) as quota_limit,
        CASE 
          WHEN COALESCE(pfv.feature_value::text::integer, sf.default_value::text::integer, 1) = -1 THEN true
          ELSE ps.is_unlimited
        END as is_unlimited,
        'daily' as reset_period
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      JOIN plan_services ps ON sp.id = ps.plan_id
      JOIN subscription_services ss ON ps.service_id = ss.id
      JOIN subscription_features sf ON ss.id = sf.service_id
      LEFT JOIN plan_feature_values pfv ON sp.id = pfv.plan_id AND sf.id = pfv.feature_id
      WHERE us.user_id = ${userId}
      AND us.status IN ('active', 'trialing')
      AND (us.expires_at IS NULL OR us.expires_at > NOW())
      AND ss.name = ${serviceName}
      AND sf.name = ${featureName}
      ORDER BY sp.sort_order DESC
      LIMIT 1
    `;

    if (subscriptionQuota.length > 0) {
      const quota = subscriptionQuota[0];
      const usage = await getUserUsage(userId, serviceName, featureName, quota.reset_period);
      return buildQuotaCheck(quota.quota_limit, usage, quota.reset_period, quota.is_unlimited, 'subscription_plan');
    }

    // 3. Fallback to system default
    return buildQuotaCheck(1, 0, 'daily', false, 'system_default');

  } catch (error) {
    console.error('Error checking user quota:', error);
    return buildQuotaCheck(0, 0, 'daily', false, 'system_default', 'Error checking quota');
  }
}

/**
 * Record usage for authenticated users
 */
export async function recordUserUsage(
  userId: number,
  serviceName: string,
  featureName: string,
  usageCount: number = 1,
  metadata?: any
): Promise<UsageRecord> {
  try {
    // Record in subscription_usage table
    const result = await sql`
      SELECT record_feature_usage(
        ${userId}, 
        ${serviceName}, 
        ${featureName}, 
        ${usageCount},
        ${metadata ? JSON.stringify(metadata) : null}
      ) as success
    `;

    if (result[0]?.success) {
      // Get updated usage info
      const quotaCheck = await checkUserQuota(userId, serviceName, featureName);
      return {
        success: true,
        new_usage_count: quotaCheck.current_usage,
        quota_limit: quotaCheck.quota_limit,
        remaining: quotaCheck.remaining,
        message: 'Usage recorded successfully'
      };
    }

    return {
      success: false,
      new_usage_count: 0,
      quota_limit: 0,
      remaining: 0,
      message: 'Failed to record usage'
    };

  } catch (error) {
    console.error('Error recording user usage:', error);
    return {
      success: false,
      new_usage_count: 0,
      quota_limit: 0,
      remaining: 0,
      message: 'Error recording usage'
    };
  }
}

// ================================
// HELPER FUNCTIONS
// ================================

async function getGuestUsage(
  guestIdentity: GuestIdentity,
  serviceName: string,
  featureName: string,
  resetPeriod: string
): Promise<number> {
  try {
    let result;
    
    // Handle machine fingerprint properly to avoid PostgreSQL parameter type issues
    const machineFingerprint = guestIdentity.machine_fingerprint || null;
    
    switch (resetPeriod) {
      case 'daily':
        if (machineFingerprint) {
          result = await sql`
            SELECT COALESCE(SUM(usage_count), 0) as usage_count
            FROM guest_usage_tracking
            WHERE client_ip = ${guestIdentity.client_ip}
            AND machine_fingerprint = ${machineFingerprint}
            AND service_name = ${serviceName}
            AND feature_name = ${featureName}
            AND usage_date = CURRENT_DATE
          `;
        } else {
          result = await sql`
            SELECT COALESCE(SUM(usage_count), 0) as usage_count
            FROM guest_usage_tracking
            WHERE client_ip = ${guestIdentity.client_ip}
            AND machine_fingerprint IS NULL
            AND service_name = ${serviceName}
            AND feature_name = ${featureName}
            AND usage_date = CURRENT_DATE
          `;
        }
        break;
      case 'weekly':
        if (machineFingerprint) {
          result = await sql`
            SELECT COALESCE(SUM(usage_count), 0) as usage_count
            FROM guest_usage_tracking
            WHERE client_ip = ${guestIdentity.client_ip}
            AND machine_fingerprint = ${machineFingerprint}
            AND service_name = ${serviceName}
            AND feature_name = ${featureName}
            AND usage_date >= DATE_TRUNC('week', CURRENT_DATE)
          `;
        } else {
          result = await sql`
            SELECT COALESCE(SUM(usage_count), 0) as usage_count
            FROM guest_usage_tracking
            WHERE client_ip = ${guestIdentity.client_ip}
            AND machine_fingerprint IS NULL
            AND service_name = ${serviceName}
            AND feature_name = ${featureName}
            AND usage_date >= DATE_TRUNC('week', CURRENT_DATE)
          `;
        }
        break;
      case 'monthly':
        if (machineFingerprint) {
          result = await sql`
            SELECT COALESCE(SUM(usage_count), 0) as usage_count
            FROM guest_usage_tracking
            WHERE client_ip = ${guestIdentity.client_ip}
            AND machine_fingerprint = ${machineFingerprint}
            AND service_name = ${serviceName}
            AND feature_name = ${featureName}
            AND usage_date >= DATE_TRUNC('month', CURRENT_DATE)
          `;
        } else {
          result = await sql`
            SELECT COALESCE(SUM(usage_count), 0) as usage_count
            FROM guest_usage_tracking
            WHERE client_ip = ${guestIdentity.client_ip}
            AND machine_fingerprint IS NULL
            AND service_name = ${serviceName}
            AND feature_name = ${featureName}
            AND usage_date >= DATE_TRUNC('month', CURRENT_DATE)
          `;
        }
        break;
      default:
        if (machineFingerprint) {
          result = await sql`
            SELECT COALESCE(SUM(usage_count), 0) as usage_count
            FROM guest_usage_tracking
            WHERE client_ip = ${guestIdentity.client_ip}
            AND machine_fingerprint = ${machineFingerprint}
            AND service_name = ${serviceName}
            AND feature_name = ${featureName}
            AND usage_date = CURRENT_DATE
          `;
        } else {
          result = await sql`
            SELECT COALESCE(SUM(usage_count), 0) as usage_count
            FROM guest_usage_tracking
            WHERE client_ip = ${guestIdentity.client_ip}
            AND machine_fingerprint IS NULL
            AND service_name = ${serviceName}
            AND feature_name = ${featureName}
            AND usage_date = CURRENT_DATE
          `;
        }
    }
    
    return result[0]?.usage_count || 0;
  } catch (error) {
    console.error('Error getting guest usage:', error);
    return 0;
  }
}

async function getUserUsage(
  userId: number,
  serviceName: string,
  featureName: string,
  resetPeriod: string
): Promise<number> {
  try {
    // Use the same date range logic as EnhancedQuotaService for consistency
    const { startDate, endDate } = getResetPeriodRange(resetPeriod);

    const result = await sql`
      SELECT COALESCE(SUM(su.usage_count), 0) as total_usage
      FROM subscription_usage su
      JOIN subscription_services ss ON su.service_id = ss.id
      JOIN subscription_features sf ON su.feature_id = sf.id
      WHERE su.user_id = ${userId}
      AND ss.name = ${serviceName}
      AND sf.name = ${featureName}
      AND su.usage_date >= ${startDate}
      AND su.usage_date <= ${endDate}
    `;

    return result[0]?.total_usage || 0;
  } catch (error) {
    console.error('Error getting user usage:', error);
    return 0;
  }
}

/**
 * Get the date range for a reset period (matching EnhancedQuotaService logic)
 */
function getResetPeriodRange(resetPeriod: string): { startDate: Date; endDate: Date } {
  const now = new Date();
  const endDate = new Date(now);
  let startDate: Date;

  switch (resetPeriod) {
    case 'hourly':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0);
      break;
    
    case 'daily':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      break;
    
    case 'weekly': {
      const dayOfWeek = now.getDay();
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek, 0, 0, 0, 0);
      break;
    }
    
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      break;
    
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      break;
  }

  return { startDate, endDate };
}

function buildQuotaCheck(
  quotaLimit: number,
  currentUsage: number,
  resetPeriod: string,
  isUnlimited: boolean,
  quotaSource: QuotaCheck['quota_source'],
  message?: string
): QuotaCheck {
  const remaining = isUnlimited ? Infinity : Math.max(0, quotaLimit - currentUsage);
  const allowed = isUnlimited || currentUsage < quotaLimit;
  
  // Calculate reset date based on period
  const resetDate = calculateResetDate(resetPeriod);

  return {
    allowed,
    quota_limit: isUnlimited ? -1 : quotaLimit,
    current_usage: currentUsage,
    remaining: isUnlimited ? -1 : remaining,
    reset_date: resetDate,
    reset_period: resetPeriod,
    is_unlimited: isUnlimited,
    quota_source: quotaSource,
    message
  };
}

function calculateResetDate(resetPeriod: string): Date {
  const now = new Date();
  
  switch (resetPeriod) {
    case 'hourly':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0, 0);
    case 'daily':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    case 'weekly': {
      const daysUntilMonday = (8 - now.getDay()) % 7;
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilMonday, 0, 0, 0, 0);
    }
    case 'monthly':
      return new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
    default:
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  }
} 