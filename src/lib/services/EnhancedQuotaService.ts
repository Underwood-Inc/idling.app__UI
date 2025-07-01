/**
 * Enhanced Quota Service
 * 
 * Provides comprehensive quota information and management for users,
 * integrating with the subscription system, user overrides, and global quotas.
 * 
 * @version 1.0.0
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
   */
  static async getUserQuotaInfo(userId: number): Promise<UserQuotaInfo[]> {
    try {
      // Get all available services and features
      const serviceFeatures = await sql`
        SELECT 
          ss.name as service_name,
          sf.name as feature_name,
          ss.display_name as service_display_name,
          sf.display_name as feature_display_name,
          sf.default_value::integer as default_quota_limit,
          sf.feature_type
        FROM subscription_services ss
        JOIN subscription_features sf ON ss.id = sf.service_id
        WHERE sf.feature_type = 'limit' 
        AND ss.is_active = true
        ORDER BY ss.name, sf.name
      `;

      // Get user's active overrides
      const userOverrides = await sql`
        SELECT * FROM user_quota_overrides
        WHERE user_id = ${userId} AND is_active = true
      `;

      // Get user's subscription plan quotas
      const subscriptionQuotas = await sql`
        SELECT 
          ss.name as service_name,
          sf.name as feature_name,
          COALESCE(pfv.feature_value::text::integer, sf.default_value::text::integer, 1) as quota_limit,
          CASE 
            WHEN COALESCE(pfv.feature_value::text::integer, sf.default_value::text::integer, 1) = -1 THEN true
            ELSE ps.is_unlimited
          END as is_unlimited,
          'monthly' as reset_period
        FROM user_subscriptions us
        JOIN subscription_plans sp ON us.plan_id = sp.id
        JOIN plan_services ps ON sp.id = ps.plan_id
        JOIN subscription_services ss ON ps.service_id = ss.id
        JOIN subscription_features sf ON ss.id = sf.service_id
        LEFT JOIN plan_feature_values pfv ON sp.id = pfv.plan_id AND sf.id = pfv.feature_id
        WHERE us.user_id = ${userId}
        AND us.status IN ('active', 'trialing')
        AND (us.expires_at IS NULL OR us.expires_at > NOW())
        AND sf.feature_type = 'limit'
        ORDER BY sp.sort_order DESC
      `;

      const quotaInfo: UserQuotaInfo[] = [];

      // Process each service feature
      for (const feature of serviceFeatures) {
        // Check for user override first (highest priority)
        const override = userOverrides.find(
          uo => uo.service_name === feature.service_name && uo.feature_name === feature.feature_name
        );

        if (override) {
          const usage = await this.getUserUsage(userId, feature.service_name, feature.feature_name, override.reset_period);
          quotaInfo.push({
            service_name: feature.service_name,
            feature_name: feature.feature_name,
            current_usage: usage,
            quota_limit: override.quota_limit,
            is_unlimited: override.is_unlimited,
            reset_date: this.calculateResetDate(override.reset_period),
            quota_source: 'user_override',
            reset_period: override.reset_period
          });
          continue;
        }

        // Check for subscription plan quota (second priority)
        const subscriptionQuota = subscriptionQuotas.find(
          sq => sq.service_name === feature.service_name && sq.feature_name === feature.feature_name
        );

        if (subscriptionQuota) {
          const usage = await this.getUserUsage(userId, feature.service_name, feature.feature_name, subscriptionQuota.reset_period);
          quotaInfo.push({
            service_name: feature.service_name,
            feature_name: feature.feature_name,
            current_usage: usage,
            quota_limit: subscriptionQuota.quota_limit,
            is_unlimited: subscriptionQuota.is_unlimited,
            reset_date: this.calculateResetDate(subscriptionQuota.reset_period),
            quota_source: 'subscription_plan',
            reset_period: subscriptionQuota.reset_period
          });
          continue;
        }

        // Fallback to system default (lowest priority)
        const usage = await this.getUserUsage(userId, feature.service_name, feature.feature_name, 'daily');
        quotaInfo.push({
          service_name: feature.service_name,
          feature_name: feature.feature_name,
          current_usage: usage,
          quota_limit: feature.default_quota_limit || 1,
          is_unlimited: false,
          reset_date: this.calculateResetDate('daily'),
          quota_source: 'system_default',
          reset_period: 'daily'
        });
      }

      return quotaInfo;

    } catch (error) {
      console.error('Error getting user quota info:', error);
      throw new Error('Failed to retrieve user quota information');
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
  private static calculateResetDate(resetPeriod: string): Date {
    const now = new Date();
    
    switch (resetPeriod) {
      case 'hourly':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0, 0);
      
      case 'daily':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
      
      case 'weekly': {
        const daysToNextWeek = 7 - now.getDay();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysToNextWeek, 0, 0, 0, 0);
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
      const quotaInfo = await this.getUserQuotaInfo(userId);
      const serviceQuota = quotaInfo.find(
        q => q.service_name === serviceName && q.feature_name === featureName
      );

      if (!serviceQuota) {
        // Return default quota if service/feature not found
        return {
          allowed: false,
          quota_limit: 1,
          current_usage: 0,
          remaining: 1,
          reset_date: this.calculateResetDate('daily'),
          is_unlimited: false,
          quota_source: 'system_default'
        };
      }

      const remaining = serviceQuota.is_unlimited ? 
        Number.MAX_SAFE_INTEGER : 
        Math.max(0, serviceQuota.quota_limit - serviceQuota.current_usage);

      return {
        allowed: serviceQuota.is_unlimited || serviceQuota.current_usage < serviceQuota.quota_limit,
        quota_limit: serviceQuota.quota_limit,
        current_usage: serviceQuota.current_usage,
        remaining,
        reset_date: serviceQuota.reset_date,
        is_unlimited: serviceQuota.is_unlimited,
        quota_source: serviceQuota.quota_source
      };

    } catch (error) {
      console.error('Error checking user quota:', error);
      throw new Error('Failed to check user quota');
    }
  }

  /**
   * Record usage for a user's service/feature
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
      // Get user's subscription and service/feature IDs
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
        throw new Error(`No active subscription found for service ${serviceName}.${featureName}`);
      }

      const { subscription_id, service_id, feature_id } = subscriptionInfo[0];

      // Record the usage
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