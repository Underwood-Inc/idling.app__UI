/**
 * Effective Quotas API for Admin Panel
 * 
 * Provides comprehensive quota information for admin user management
 * showing subscription quotas, overrides, and effective limits.
 * 
 * @version 1.0.0
 * @author System
 */

import { checkUserPermission } from '@/lib/actions/permissions.actions';
import { auth } from '@/lib/auth';
import sql from '@/lib/db';
import { withRateLimit } from '@lib/middleware/withRateLimit';
import { PERMISSIONS } from '@lib/permissions/permissions';
import { EnhancedQuotaService } from '@lib/services/EnhancedQuotaService';
import { NextRequest, NextResponse } from 'next/server';

// ================================
// TYPES & INTERFACES
// ================================

interface EffectiveQuotaData {
  service_name: string;
  feature_name: string;
  display_name: string;
  current_usage: number;
  // Subscription quota
  subscription_quota_limit: number | null;
  subscription_is_unlimited: boolean;
  subscription_plan_name?: string;
  // Override quota
  override_quota_limit: number | null;
  override_is_unlimited: boolean;
  override_reason?: string;
  // Effective (active) quota
  effective_quota_limit: number;
  effective_is_unlimited: boolean;
  effective_source: 'subscription_plan' | 'user_override' | 'none';
  reset_date: string;
  reset_period: string;
}

interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
}

// ================================
// HELPER FUNCTIONS
// ================================

async function validateUserExists(userId: string): Promise<boolean> {
  try {
    const result = await sql`
      SELECT 1 FROM users WHERE id = ${userId}
    `;
    return result.length > 0;
  } catch (error) {
    console.error('Error validating user exists:', error);
    return false;
  }
}

// ================================
// API HANDLERS
// ================================

/**
 * GET /api/admin/users/[id]/effective-quotas
 * Retrieves comprehensive effective quota information for admin panel
 */
async function getHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<{ quotas: EffectiveQuotaData[] }> | ErrorResponse>> {
  try {
    // Validate session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Canonical admin permission check
    const userId = parseInt(session.user.id);
    const hasPermission = await checkUserPermission(userId, PERMISSIONS.ADMIN.USERS_VIEW);
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Validate user exists
    const userExists = await validateUserExists(params.id);
    if (!userExists) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get comprehensive quota info using EnhancedQuotaService
    const quotaInfo = await EnhancedQuotaService.getUserQuotaInfo(parseInt(params.id));
    
    // Get additional display information for proper names
    const serviceFeatures = await sql`
      SELECT 
        ss.name as service_name,
        sf.name as feature_name,
        ss.display_name as service_display_name,
        sf.display_name as feature_display_name
      FROM subscription_services ss
      JOIN subscription_features sf ON ss.id = sf.service_id
      WHERE sf.feature_type = 'limit' AND ss.is_active = true
    `;

    // Get user's subscription plan information
    const userSubscription = await sql`
      SELECT 
        sp.name as plan_name,
        sp.display_name as plan_display_name
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.user_id = ${params.id}
      AND us.status IN ('active', 'trialing')
      AND (us.expires_at IS NULL OR us.expires_at > NOW())
      ORDER BY sp.sort_order DESC
      LIMIT 1
    `;

    // Get user overrides for additional context
    const userOverrides = await sql`
      SELECT 
        service_name,
        feature_name,
        quota_limit,
        is_unlimited,
        reason
      FROM user_quota_overrides
      WHERE user_id = ${params.id}
      AND is_active = true
    `;

    // Transform quota info to admin panel format
    const quotaData: EffectiveQuotaData[] = quotaInfo.map(info => {
      const serviceFeature = serviceFeatures.find(
        sf => sf.service_name === info.service_name && sf.feature_name === info.feature_name
      );

      const override = userOverrides.find(
        uo => uo.service_name === info.service_name && uo.feature_name === info.feature_name
      );

      // Determine subscription quota (if no override exists)
      let subscriptionQuotaLimit: number | null = null;
      let subscriptionIsUnlimited = false;
      let subscriptionPlanName: string | undefined;

      if (!override && info.quota_source === 'subscription_plan') {
        subscriptionQuotaLimit = info.quota_limit;
        subscriptionIsUnlimited = info.is_unlimited;
        subscriptionPlanName = userSubscription[0]?.plan_display_name || userSubscription[0]?.plan_name;
      }

      return {
        service_name: info.service_name,
        feature_name: info.feature_name,
        display_name: serviceFeature ? 
          `${serviceFeature.service_display_name} - ${serviceFeature.feature_display_name}` : 
          `${info.service_name} - ${info.feature_name}`,
        current_usage: info.current_usage,
        // Subscription quota
        subscription_quota_limit: subscriptionQuotaLimit,
        subscription_is_unlimited: subscriptionIsUnlimited,
        subscription_plan_name: subscriptionPlanName,
        // Override quota
        override_quota_limit: override ? override.quota_limit : null,
        override_is_unlimited: override ? override.is_unlimited : false,
        override_reason: override ? override.reason : undefined,
        // Effective (active) quota
        effective_quota_limit: info.quota_limit,
        effective_is_unlimited: info.is_unlimited,
        effective_source: info.quota_source === 'user_override' ? 'user_override' : 
                         info.quota_source === 'subscription_plan' ? 'subscription_plan' : 'none',
        reset_date: info.reset_date?.toISOString() || new Date(Date.now() + 86400000).toISOString(),
        reset_period: info.reset_period
      };
    });

    return NextResponse.json({
      success: true,
      data: { quotas: quotaData },
      message: `Retrieved ${quotaData.length} effective quota entries for user`
    });

  } catch (error) {
    console.error('GET /api/admin/users/[id]/effective-quotas error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: 'Failed to retrieve effective quotas'
      },
      { status: 500 }
    );
  }
}

// Apply rate limiting to handler
export const GET = withRateLimit(getHandler);

// Removed default export - Next.js API routes should only use named exports 