/**
 * Enhanced Quota Service
 * 
 * Provides comprehensive quota management for both authenticated users and anonymous guests
 * with feature-level granularity and proper hierarchy handling.
 * 
 * Priority Order:
 * 1. User-specific quota overrides (highest priority)
 * 2. Subscription plan quotas
 * 3. Global guest quotas (for anonymous users)
 * 4. System defaults (fallback)
 * 
 * @version 1.0.0
 * @author System
 */

import sql from '@/lib/db';

// ================================
// TYPES & INTERFACES
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

export interface QuotaInfo {
  service_name: string;
  feature_name: string;
  quota_limit: number;
  is_unlimited: boolean;
  reset_period: string;
  current_usage: number;
  reset_date: Date | null;
  quota_source: string;
}

interface GuestIdentity {
  client_ip: string;
  machine_fingerprint?: string;
  user_agent_hash?: string;
}

interface UserQuotaOverride {
  id: number;
  user_id: number;
  service_name: string;
  feature_name: string;
  quota_limit: number;
  is_unlimited: boolean;
  reset_period: string;
  is_active: boolean;
}

interface GlobalGuestQuota {
  id: number;
  service_name: string;
  feature_name: string;
  quota_limit: number;
  is_unlimited: boolean;
  reset_period: string;
  is_active: boolean;
}

// ================================
// ENHANCED QUOTA SERVICE CLASS
// ================================

export class EnhancedQuotaService {
  
  /**
   * Check quota for authenticated user
   */
  static async checkUserQuota(
    userId: number,
    serviceName: string,
    featureName: string
  ): Promise<QuotaCheck> {
    try {
      // 1. Check for user-specific override (highest priority)
      const userOverride = await this.getUserQuotaOverride(userId, serviceName, featureName);
      if (userOverride) {
        const usage = await this.getUserUsage(userId, serviceName, featureName, userOverride.reset_period);
        return this.buildQuotaCheck(userOverride.quota_limit, usage, userOverride.reset_period, userOverride.is_unlimited, 'user_override');
      }

      // 2. Check subscription plan quota
      const subscriptionQuota = await this.getSubscriptionQuota(userId, serviceName, featureName);
      if (subscriptionQuota) {
        const usage = await this.getUserUsage(userId, serviceName, featureName, subscriptionQuota.reset_period);
        return this.buildQuotaCheck(subscriptionQuota.quota_limit, usage, subscriptionQuota.reset_period, subscriptionQuota.is_unlimited, 'subscription_plan');
      }

      // 3. Fallback to system default
      return this.buildQuotaCheck(1, 0, 'daily', false, 'system_default');

    } catch (error) {
      console.error('Error checking user quota:', error);
      return this.buildQuotaCheck(0, 0, 'daily', false, 'system_default', 'Error checking quota');
    }
  }

  /**
   * Check quota for anonymous guest user
   */
  static async checkGuestQuota(
    guestIdentity: GuestIdentity,
    serviceName: string,
    featureName: string
  ): Promise<QuotaCheck> {
    try {
      // 1. Check for global guest quota
      const globalQuota = await this.getGlobalGuestQuota(serviceName, featureName);
      if (globalQuota) {
        const usage = await this.getGuestUsage(guestIdentity, serviceName, featureName, globalQuota.reset_period);
        return this.buildQuotaCheck(globalQuota.quota_limit, usage, globalQuota.reset_period, globalQuota.is_unlimited, 'global_guest');
      }

      // 2. Fallback to system default for guests (typically 1 per day)
      const usage = await this.getGuestUsage(guestIdentity, serviceName, featureName, 'daily');
      return this.buildQuotaCheck(1, usage, 'daily', false, 'system_default');

    } catch (error) {
      console.error('Error checking guest quota:', error);
      return this.buildQuotaCheck(0, 0, 'daily', false, 'system_default', 'Error checking quota');
    }
  }

  /**
   * Record usage for authenticated user
   */
  static async recordUserUsage(
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
        const quotaCheck = await this.checkUserQuota(userId, serviceName, featureName);
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

  /**
   * Record usage for anonymous guest user
   */
  static async recordGuestUsage(
    guestIdentity: GuestIdentity,
    serviceName: string,
    featureName: string,
    usageCount: number = 1,
    metadata?: any
  ): Promise<UsageRecord> {
    try {
      // Record in guest_usage_tracking table
      const result = await sql`
        SELECT record_guest_usage(
          ${guestIdentity.client_ip},
          ${serviceName},
          ${featureName},
          ${guestIdentity.machine_fingerprint || null},
          ${guestIdentity.user_agent_hash || null},
          ${usageCount},
          ${metadata ? JSON.stringify(metadata) : null}
        ) as success
      `;

      if (result[0]?.success) {
        // Get updated usage info
        const quotaCheck = await this.checkGuestQuota(guestIdentity, serviceName, featureName);
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
   * Get comprehensive quota information for a user
   */
  static async getUserQuotaInfo(userId: number): Promise<QuotaInfo[]> {
    try {
      const quotaInfo: QuotaInfo[] = [];

      // Get all available services and features
      const services = await sql`
        SELECT DISTINCT ss.name as service_name, sf.name as feature_name
        FROM subscription_services ss
        JOIN subscription_features sf ON ss.id = sf.service_id
        WHERE sf.feature_type = 'limit' AND ss.is_active = true
        ORDER BY ss.name, sf.name
      `;

      for (const service of services) {
        const quotaCheck = await this.checkUserQuota(userId, service.service_name, service.feature_name);
        quotaInfo.push({
          service_name: service.service_name,
          feature_name: service.feature_name,
          quota_limit: quotaCheck.quota_limit,
          is_unlimited: quotaCheck.is_unlimited,
          reset_period: quotaCheck.reset_period,
          current_usage: quotaCheck.current_usage,
          reset_date: quotaCheck.reset_date,
          quota_source: quotaCheck.quota_source
        });
      }

      return quotaInfo;

    } catch (error) {
      console.error('Error getting user quota info:', error);
      return [];
    }
  }

  // ================================
  // PRIVATE HELPER METHODS
  // ================================

  private static async getUserQuotaOverride(
    userId: number,
    serviceName: string,
    featureName: string
  ): Promise<UserQuotaOverride | null> {
    try {
      const result = await sql`
        SELECT * FROM user_quota_overrides
        WHERE user_id = ${userId} 
        AND service_name = ${serviceName} 
        AND feature_name = ${featureName}
        AND is_active = true
      `;
      return result[0] as UserQuotaOverride || null;
    } catch (error) {
      console.error('Error getting user quota override:', error);
      return null;
    }
  }

  private static async getSubscriptionQuota(
    userId: number,
    serviceName: string,
    featureName: string
  ): Promise<{ quota_limit: number; is_unlimited: boolean; reset_period: string } | null> {
    try {
      const result = await sql`
        SELECT sf.quota_limit, sf.is_unlimited, 'monthly' as reset_period
        FROM user_subscriptions us
        JOIN subscription_plans sp ON us.plan_id = sp.id
        JOIN subscription_services ss ON sp.id = ss.plan_id
        JOIN subscription_features sf ON ss.id = sf.service_id
        WHERE us.user_id = ${userId}
        AND us.is_active = true
        AND us.expires_at > NOW()
        AND ss.name = ${serviceName}
        AND sf.name = ${featureName}
        ORDER BY sp.tier_level DESC
        LIMIT 1
      `;
             return result[0] as { quota_limit: number; is_unlimited: boolean; reset_period: string } || null;
    } catch (error) {
      console.error('Error getting subscription quota:', error);
      return null;
    }
  }

  private static async getGlobalGuestQuota(
    serviceName: string,
    featureName: string
  ): Promise<GlobalGuestQuota | null> {
    try {
      const result = await sql`
        SELECT * FROM global_guest_quotas
        WHERE service_name = ${serviceName}
        AND feature_name = ${featureName}
        AND is_active = true
      `;
      return result[0] as GlobalGuestQuota || null;
    } catch (error) {
      console.error('Error getting global guest quota:', error);
      return null;
    }
  }

  private static async getUserUsage(
    userId: number,
    serviceName: string,
    featureName: string,
    resetPeriod: string
  ): Promise<number> {
    try {
      const result = await sql`
        SELECT get_user_usage(${userId}, ${serviceName}, ${featureName}, ${resetPeriod}) as usage_count
      `;
      return result[0]?.usage_count || 0;
    } catch (error) {
      console.error('Error getting user usage:', error);
      return 0;
    }
  }

  private static async getGuestUsage(
    guestIdentity: GuestIdentity,
    serviceName: string,
    featureName: string,
    resetPeriod: string
  ): Promise<number> {
    try {
      const result = await sql`
        SELECT get_guest_usage(
          ${guestIdentity.client_ip},
          ${serviceName},
          ${featureName},
          ${guestIdentity.machine_fingerprint || null},
          ${resetPeriod}
        ) as usage_count
      `;
      return result[0]?.usage_count || 0;
    } catch (error) {
      console.error('Error getting guest usage:', error);
      return 0;
    }
  }

  private static buildQuotaCheck(
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
    const resetDate = this.calculateResetDate(resetPeriod);

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

  private static calculateResetDate(resetPeriod: string): Date {
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
} 