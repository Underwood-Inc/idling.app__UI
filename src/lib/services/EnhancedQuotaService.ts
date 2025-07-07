/**
 * Enhanced Quota Service
 * 
 * Agnostic quota system that can be leveraged by subscriptions and other systems.
 * When both subscription and override quotas exist, uses the higher value.
 * 
 * Architecture:
 * - Quota system is the foundation (handles all quota logic)
 * - Subscription system integrates with quota system but doesn't replace it
 * - When both subscription and override exist, use the higher quota
 * - Admin interface manages both systems independently
 * 
 * @version 2.0.0
 * @author System
 */

import sql from '@/lib/db';

// ================================
// TYPES & INTERFACES
// ================================

export interface UserQuotaInfo {
  service_name: string;
  feature_name: string;
  current_usage: number;
  quota_limit: number;
  is_unlimited: boolean;
  reset_date: Date | null;
  quota_source: 'user_override' | 'subscription_plan' | 'global_guest' | 'system_default';
  reset_period: string;
}

export interface QuotaOverride {
  id: number;
  user_id: number;
  service_name: string;
  feature_name: string;
  quota_limit: number;
  is_unlimited: boolean;
  reset_period: string;
  is_active: boolean;
  reason: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceFeature {
  service_name: string;
  feature_name: string;
  service_display_name: string;
  feature_display_name: string;
  default_quota_limit: number;
  feature_type: string;
}

// ================================
// ENHANCED QUOTA SERVICE
// ================================

export class EnhancedQuotaService {
  /**
   * Get comprehensive quota information for a specific user
   * Returns all available services and features with their current usage and limits
   * Shows effective quota: override takes precedence over plan quota, falls back to service defaults
   */
  static async getUserQuotaInfo(userId: number): Promise<UserQuotaInfo[]> {
    try {
      const quotaInfo: UserQuotaInfo[] = [];

      // Get ALL available service/feature combinations that support quotas
      const availableServices = await sql`
        SELECT 
          ss.name as service_name,
          sf.name as feature_name,
          ss.display_name as service_display_name,
          sf.display_name as feature_display_name,
          sf.feature_type,
          sf.default_value
        FROM subscription_services ss
        JOIN subscription_features sf ON ss.id = sf.service_id
        WHERE ss.is_active = true 
        AND sf.feature_type = 'limit'
        ORDER BY ss.name, sf.name
      `;

      // Get user's current subscription plan quotas
      const userPlanQuotas = await sql`
        SELECT 
          ss.name as service_name,
          sf.name as feature_name,
          COALESCE(pfv.feature_value::text::integer, sf.default_value::text::integer) as plan_quota,
          sp.name as plan_name
        FROM user_subscriptions us
        JOIN subscription_plans sp ON us.plan_id = sp.id
        JOIN plan_services ps ON sp.id = ps.plan_id
        JOIN subscription_services ss ON ps.service_id = ss.id
        JOIN subscription_features sf ON ss.id = sf.service_id
        LEFT JOIN plan_feature_values pfv ON sp.id = pfv.plan_id AND sf.id = pfv.feature_id
        WHERE us.user_id = ${userId} 
        AND us.status = 'active'
        AND sf.feature_type = 'limit'
      `;

      // Get existing user overrides
      const userOverrides = await sql`
        SELECT * FROM user_quota_overrides
        WHERE user_id = ${userId} 
        AND is_active = true
      `;

      // Build comprehensive quota data for ALL available services
      for (const service of availableServices) {
        const planQuota = userPlanQuotas.find(
          pq => pq.service_name === service.service_name && pq.feature_name === service.feature_name
        );
        
        const override = userOverrides.find(
          uo => uo.service_name === service.service_name && uo.feature_name === service.feature_name
        );

        let effectiveQuota: number, quotaSource: 'user_override' | 'subscription_plan' | 'global_guest' | 'system_default', resetPeriod: string;

        if (override) {
          // Override exists - use override values (ignores plan completely)
          effectiveQuota = override.quota_limit;
          quotaSource = 'user_override';
          resetPeriod = override.reset_period;
        } else if (planQuota) {
          // No override but user has plan - use plan quota
          effectiveQuota = planQuota.plan_quota;
          quotaSource = 'subscription_plan';
          resetPeriod = 'daily'; // Default reset period for plan quotas
        } else {
          // No override and no plan - use service default value for admin management
          effectiveQuota = parseInt(service.default_value) || 0;
          quotaSource = 'system_default';
          resetPeriod = 'daily';
        }

        const usage = effectiveQuota > 0 ? 
          await this.getUserUsage(userId, service.service_name, service.feature_name, resetPeriod) : 
          0;

        quotaInfo.push({
          service_name: service.service_name,
          feature_name: service.feature_name,
          current_usage: usage,
          quota_limit: effectiveQuota,
          is_unlimited: effectiveQuota === -1,
          reset_date: effectiveQuota > 0 ? this.calculateResetDate(resetPeriod) : null,
          quota_source: quotaSource,
          reset_period: resetPeriod
        });
      }

      return quotaInfo;

    } catch (error) {
      console.error('Error getting user quota info:', error);
      throw new Error('Failed to retrieve user quota information');
    }
  }

  /**
   * Get quota from user overrides
   */
  private static async getUserOverrideQuota(
    userId: number,
    serviceName: string,
    featureName: string
  ): Promise<{
    quota_limit: number;
    is_unlimited: boolean;
    reset_period: string;
  } | null> {
    try {
      const result = await sql<{
        quota_limit: number;
        is_unlimited: boolean;
        reset_period: string;
      }[]>`
        SELECT quota_limit, is_unlimited, reset_period
        FROM user_quota_overrides
        WHERE user_id = ${userId}
        AND service_name = ${serviceName}
        AND feature_name = ${featureName}
        AND is_active = true
      `;

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error getting user override quota:', error);
      return null;
    }
  }

  /**
   * Get quota from user's subscription plan
   */
  private static async getUserSubscriptionQuota(
    userId: number,
    serviceName: string,
    featureName: string
  ): Promise<{
    quota_limit: number;
    is_unlimited: boolean;
    reset_period: string;
  } | null> {
    try {
      const result = await sql<{
        quota_limit: number;
        is_unlimited: boolean;
        reset_period: string;
      }[]>`
        SELECT 
          COALESCE(pfv.feature_value::text::integer, sf.default_value::text::integer) as quota_limit,
          CASE 
            WHEN COALESCE(pfv.feature_value::text::integer, sf.default_value::text::integer) = -1 THEN true
            ELSE COALESCE(ps.is_unlimited, false)
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

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error getting user subscription quota:', error);
      return null;
    }
  }

  /**
   * Get current usage for a user's specific service and feature
   */
  private static async getUserUsage(
    userId: number,
    serviceName: string,
    featureName: string,
    resetPeriod: string
  ): Promise<number> {
    try {
      const { startDate, endDate } = this.getResetPeriodRange(resetPeriod);

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
   * Calculate the next reset date based on reset period
   */
  public static calculateResetDate(resetPeriod: string): Date {
    const now = new Date();
    
    switch (resetPeriod) {
      case 'hourly':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0, 0);
      
      case 'daily':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
      
      case 'weekly': {
        // Use same logic as getResetPeriodRange - week starts on Sunday (day 0)
        const dayOfWeek = now.getDay();
        const daysUntilNextWeek = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;
        return new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilNextWeek, 0, 0, 0, 0);
      }
      
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
      
      default:
        return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    }
  }

  /**
   * Get the date range for a reset period
   */
  private static getResetPeriodRange(resetPeriod: string): { startDate: Date; endDate: Date } {
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

  /**
   * Check if a user has exceeded their quota for a specific service/feature
   * Uses agnostic quota system - checks both overrides and subscriptions, uses higher value
   */
  static async checkUserQuota(
    userId: number,
    serviceName: string,
    featureName: string
  ): Promise<{
    allowed: boolean;
    quota_limit: number;
    current_usage: number;
    remaining: number;
    reset_date: Date | null;
    is_unlimited: boolean;
    quota_source: string;
  }> {
    try {
      // Get quota from both sources
      const overrideQuota = await this.getUserOverrideQuota(userId, serviceName, featureName);
      const subscriptionQuota = await this.getUserSubscriptionQuota(userId, serviceName, featureName);

      // Determine which quota to use (higher value wins)
      let effectiveQuota: {
        quota_limit: number;
        is_unlimited: boolean;
        reset_period: string;
      } | null = null;
      let quotaSource = 'user_override';

      if (subscriptionQuota && overrideQuota) {
        // Both exist - use the higher quota
        if (subscriptionQuota.is_unlimited || 
            (!overrideQuota.is_unlimited && subscriptionQuota.quota_limit > overrideQuota.quota_limit)) {
          effectiveQuota = subscriptionQuota;
          quotaSource = 'subscription_plan';
        } else {
          effectiveQuota = overrideQuota;
          quotaSource = 'user_override';
        }
      } else if (subscriptionQuota && !overrideQuota) {
        // Only subscription exists
        effectiveQuota = subscriptionQuota;
        quotaSource = 'subscription_plan';
      } else if (!subscriptionQuota && overrideQuota) {
        // Only override exists
        effectiveQuota = overrideQuota;
        quotaSource = 'user_override';
      } else {
        // No quota found - return default behavior
        return {
          allowed: false,
          quota_limit: 0,
          current_usage: 0,
          remaining: 0,
          reset_date: null,
          is_unlimited: false,
          quota_source: 'none'
        };
      }

      // Get current usage for the effective quota period
      const currentUsage = await this.getUserUsage(
        userId, 
        serviceName, 
        featureName, 
        effectiveQuota.reset_period
      );

      const remaining = effectiveQuota.is_unlimited ? 
        Number.MAX_SAFE_INTEGER : 
        Math.max(0, effectiveQuota.quota_limit - currentUsage);

      return {
        allowed: effectiveQuota.is_unlimited || currentUsage < effectiveQuota.quota_limit,
        quota_limit: effectiveQuota.quota_limit,
        current_usage: currentUsage,
        remaining,
        reset_date: this.calculateResetDate(effectiveQuota.reset_period),
        is_unlimited: effectiveQuota.is_unlimited,
        quota_source: quotaSource
      };

    } catch (error) {
      console.error('Error checking user quota:', error);
      throw new Error('Failed to check user quota');
    }
  }

  /**
   * Record usage for a user's service/feature
   * Handles both quota overrides and subscription-based quotas
   */
  static async recordUserUsage(
    userId: number,
    serviceName: string,
    featureName: string,
    usageCount: number = 1,
    metadata?: any
  ): Promise<{
    success: boolean;
    new_usage_count: number;
    quota_limit: number;
    remaining: number;
    message?: string;
  }> {
    try {
      // First check if user has a quota override
      const userOverride = await sql`
        SELECT * FROM user_quota_overrides
        WHERE user_id = ${userId} 
        AND service_name = ${serviceName} 
        AND feature_name = ${featureName}
        AND is_active = true
      `;

      if (userOverride.length > 0) {
        // User has quota override - record usage in a generic usage tracking table
        // Get service and feature IDs for consistent tracking
        const serviceInfo = await sql`
          SELECT ss.id as service_id, sf.id as feature_id
          FROM subscription_services ss
          JOIN subscription_features sf ON ss.id = sf.service_id
          WHERE ss.name = ${serviceName}
          AND sf.name = ${featureName}
          LIMIT 1
        `;

        if (serviceInfo.length === 0) {
          throw new Error(`Service ${serviceName}.${featureName} not found`);
        }

        const { service_id, feature_id } = serviceInfo[0];

        // Record usage in subscription_usage table with NULL subscription_id for override users
        await sql`
          INSERT INTO subscription_usage (
            user_id, subscription_id, service_id, feature_id, usage_date, usage_count, metadata
          ) VALUES (
            ${userId}, NULL, ${service_id}, ${feature_id}, CURRENT_DATE, ${usageCount}, 
            ${metadata ? JSON.stringify(metadata) : null}
          )
          ON CONFLICT (user_id, COALESCE(subscription_id, 0), service_id, feature_id, usage_date)
          DO UPDATE SET 
            usage_count = subscription_usage.usage_count + ${usageCount},
            updated_at = NOW(),
            metadata = COALESCE(${metadata ? JSON.stringify(metadata) : null}, subscription_usage.metadata)
        `;
      } else {
        // User doesn't have override - try subscription-based quota
        const subscriptionInfo = await sql`
          SELECT us.id as subscription_id, ss.id as service_id, sf.id as feature_id
          FROM user_subscriptions us
          JOIN subscription_plans sp ON us.plan_id = sp.id
          JOIN plan_services ps ON sp.id = ps.plan_id
          JOIN subscription_services ss ON ps.service_id = ss.id
          JOIN subscription_features sf ON ss.id = sf.service_id
          WHERE us.user_id = ${userId}
          AND us.status IN ('active', 'trialing')
          AND (us.expires_at IS NULL OR us.expires_at > NOW())
          AND ss.name = ${serviceName}
          AND sf.name = ${featureName}
          LIMIT 1
        `;

        if (subscriptionInfo.length === 0) {
          throw new Error(`No active subscription or quota override found for service ${serviceName}.${featureName}`);
        }

        const { subscription_id, service_id, feature_id } = subscriptionInfo[0];

        // Record the usage with subscription
        await sql`
          INSERT INTO subscription_usage (
            user_id, subscription_id, service_id, feature_id, usage_date, usage_count, metadata
          ) VALUES (
            ${userId}, ${subscription_id}, ${service_id}, ${feature_id}, CURRENT_DATE, ${usageCount}, 
            ${metadata ? JSON.stringify(metadata) : null}
          )
          ON CONFLICT (user_id, subscription_id, service_id, feature_id, usage_date)
          DO UPDATE SET 
            usage_count = subscription_usage.usage_count + ${usageCount},
            updated_at = NOW(),
            metadata = COALESCE(${metadata ? JSON.stringify(metadata) : null}, subscription_usage.metadata)
        `;
      }

      // Get updated quota info
      const quotaCheck = await this.checkUserQuota(userId, serviceName, featureName);

      return {
        success: true,
        new_usage_count: quotaCheck.current_usage,
        quota_limit: quotaCheck.quota_limit,
        remaining: quotaCheck.remaining,
        message: 'Usage recorded successfully'
      };

    } catch (error) {
      console.error('Error recording user usage:', error);
      return {
        success: false,
        new_usage_count: 0,
        quota_limit: 0,
        remaining: 0,
        message: 'Failed to record usage'
      };
    }
  }

  /**
   * Reset a user's quota for a specific service/feature
   */
  static async resetUserQuota(
    userId: number,
    serviceName: string,
    featureName: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get current usage before reset for audit logging
      const currentUsage = await sql`
        SELECT COALESCE(SUM(su.usage_count), 0) as total_usage
        FROM subscription_usage su
        JOIN subscription_services ss ON su.service_id = ss.id
        JOIN subscription_features sf ON su.feature_id = sf.id
        WHERE su.user_id = ${userId}
        AND ss.name = ${serviceName}
        AND sf.name = ${featureName}
        AND su.usage_date >= CURRENT_DATE
      `;

      const previousUsage = currentUsage[0]?.total_usage || 0;

      // Delete usage records for this user/service/feature
      const resetResult = await sql`
        DELETE FROM subscription_usage
        WHERE user_id = ${userId}
        AND service_id IN (
          SELECT ss.id FROM subscription_services ss WHERE ss.name = ${serviceName}
        )
        AND feature_id IN (
          SELECT sf.id FROM subscription_features sf 
          JOIN subscription_services ss ON sf.service_id = ss.id
          WHERE ss.name = ${serviceName} AND sf.name = ${featureName}
        )
      `;

      // Log the reset action for audit trail
      await sql`
        INSERT INTO admin_actions (
          admin_user_id, action_type, action_details, reason, created_at
        ) VALUES (
          ${userId}, 'quota_reset', ${JSON.stringify({
            target_user_id: userId,
            service_name: serviceName,
            feature_name: featureName,
            previous_usage: previousUsage,
            reset_count: resetResult.count
          })}, ${reason || `Reset quota for ${serviceName}.${featureName}`}, NOW()
        )
      `;

      return {
        success: true,
        message: `Quota reset successfully for ${serviceName}.${featureName} (previous usage: ${previousUsage})`
      };

    } catch (error) {
      console.error('Error resetting user quota:', error);
      return {
        success: false,
        message: 'Failed to reset quota'
      };
    }
  }
}

export default EnhancedQuotaService; 