/**
 * User Quota Management API
 * 
 * Provides secure, type-safe endpoints for viewing and managing user quotas
 * within the existing subscription system.
 * 
 * @version 1.0.0
 * @author System
 */

import { auth } from '@/lib/auth';
import sql from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ================================
// TYPES & SCHEMAS
// ================================

interface UserQuotaData {
  service_name: string;
  display_name: string;
  current_usage: number;
  quota_limit: number;
  is_unlimited: boolean;
  is_custom: boolean;
  reset_date: string;
  usage_percentage: number;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
  data?: any;
}

// Request validation schemas
const UpdateQuotaSchema = z.object({
  service_name: z.string().min(1, 'Service name is required'),
  quota_limit: z.number().int().min(0, 'Quota limit must be non-negative').optional(),
  is_unlimited: z.boolean().default(false),
  reason: z.string().min(5, 'Reason must be at least 5 characters')
});

const ParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'User ID must be a valid number')
});

// ================================
// UTILITY FUNCTIONS
// ================================

/**
 * Validates admin permissions for the current session
 */
async function validateAdminAccess(sessionUserId: string): Promise<boolean> {
  try {
    const adminCheck = await sql`
      SELECT ura.role_id, ur.name as role_name
      FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = ${sessionUserId}
      AND ur.name IN ('admin', 'moderator')
      AND ura.is_active = true
      AND (ura.expires_at IS NULL OR ura.expires_at > CURRENT_TIMESTAMP)
      LIMIT 1
    `;
    
    return adminCheck.length > 0;
  } catch (error) {
    console.error('Admin validation error:', error);
    return false;
  }
}

/**
 * Logs admin actions for audit trail
 */
async function logAdminAction(
  adminUserId: string,
  targetUserId: number,
  actionType: string,
  actionDetails: object,
  reason: string
): Promise<void> {
  try {
    await sql`
      INSERT INTO admin_actions (
        admin_user_id,
        target_user_id,
        action_type,
        action_details,
        reason,
        created_at
      ) VALUES (
        ${adminUserId},
        ${targetUserId},
        ${actionType},
        ${JSON.stringify(actionDetails)},
        ${reason},
        NOW()
      )
    `;
  } catch (error) {
    console.error('Failed to log admin action:', error);
    // Don't throw - logging failure shouldn't break the main operation
  }
}

/**
 * Fetches user quota data with comprehensive error handling
 */
async function fetchUserQuotas(userId: number): Promise<UserQuotaData[]> {
  const quotaQuery = await sql`
    WITH user_subscription AS (
      SELECT us.*, sp.name as plan_name, sp.sort_order
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.user_id = ${userId}
        AND us.status IN ('active', 'trialing')
        AND (us.expires_at IS NULL OR us.expires_at > NOW())
      ORDER BY sp.sort_order DESC
      LIMIT 1
    ),
    service_features AS (
      SELECT DISTINCT
        ss.name as service_name,
        ss.display_name as service_display_name,
        sf.name as feature_name,
        sf.display_name as feature_display_name,
        sf.feature_type,
        COALESCE(pfv.feature_value, sf.default_value) as feature_value,
        CASE 
          WHEN pfv.feature_value IS NOT NULL THEN true
          ELSE false
        END as is_custom
      FROM subscription_services ss
      JOIN subscription_features sf ON ss.id = sf.service_id
      LEFT JOIN plan_feature_values pfv ON sf.id = pfv.feature_id
      LEFT JOIN user_subscription us ON pfv.plan_id = us.plan_id
      WHERE sf.feature_type = 'limit'
        AND (sf.name LIKE '%_limit%' OR sf.name LIKE '%_generations%' OR sf.name LIKE '%_slots%')
        AND ss.is_active = true
    ),
    current_usage AS (
      SELECT 
        ss.name as service_name,
        sf.name as feature_name,
        COALESCE(su.usage_count, 0) as current_usage,
        CASE 
          WHEN sf.name = 'daily_generations' THEN CURRENT_DATE + INTERVAL '1 day'
          WHEN sf.name LIKE 'monthly_%' THEN DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
          WHEN sf.name LIKE 'yearly_%' THEN DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year'
          ELSE CURRENT_DATE + INTERVAL '1 day'
        END as reset_date
      FROM subscription_services ss
      JOIN subscription_features sf ON ss.id = sf.service_id
      LEFT JOIN subscription_usage su ON ss.id = su.service_id 
        AND sf.id = su.feature_id 
        AND su.user_id = ${userId}
        AND su.usage_date = CURRENT_DATE
      WHERE sf.feature_type = 'limit'
        AND ss.is_active = true
    )
    SELECT 
      sf.service_name,
      sf.service_display_name as display_name,
      COALESCE(cu.current_usage, 0) as current_usage,
      CASE 
        WHEN sf.feature_value::text = '-1' THEN -1
        ELSE GREATEST((sf.feature_value::text)::integer, 0)
      END as quota_limit,
      CASE 
        WHEN sf.feature_value::text = '-1' THEN true
        ELSE false
      END as is_unlimited,
      sf.is_custom,
      COALESCE(cu.reset_date::text, (CURRENT_DATE + INTERVAL '1 day')::text) as reset_date
    FROM service_features sf
    LEFT JOIN current_usage cu ON sf.service_name = cu.service_name 
      AND sf.feature_name = cu.feature_name
    WHERE sf.service_name IS NOT NULL
    ORDER BY sf.service_name
  `;

  return quotaQuery.map((row: any): UserQuotaData => {
    const currentUsage = parseInt(row.current_usage) || 0;
    const quotaLimit = parseInt(row.quota_limit) || 0;
    const isUnlimited = row.is_unlimited || quotaLimit === -1;
    
    return {
      service_name: row.service_name,
      display_name: row.display_name || row.service_name,
      current_usage: currentUsage,
      quota_limit: isUnlimited ? -1 : quotaLimit,
      is_unlimited: isUnlimited,
      is_custom: row.is_custom || false,
      reset_date: row.reset_date,
      usage_percentage: isUnlimited ? 0 : Math.min((currentUsage / Math.max(quotaLimit, 1)) * 100, 100)
    };
  });
}

/**
 * Updates user quota with proper transaction handling
 */
async function updateUserQuota(
  userId: number,
  serviceName: string,
  quotaLimit: number | undefined,
  isUnlimited: boolean
): Promise<{ success: boolean; affectedRows: number }> {
  try {
    // Use transaction for data consistency
    const result = await sql.begin(async (sql) => {
      // First, get the user's subscription and feature IDs
      const subscriptionData = await sql`
        WITH user_subscription AS (
          SELECT us.id, us.plan_id
          FROM user_subscriptions us
          WHERE us.user_id = ${userId}
            AND us.status IN ('active', 'trialing')
            AND (us.expires_at IS NULL OR us.expires_at > NOW())
          ORDER BY (SELECT sort_order FROM subscription_plans WHERE id = us.plan_id) DESC
          LIMIT 1
        ),
        service_feature AS (
          SELECT sf.id as feature_id, ss.display_name as service_display_name
          FROM subscription_services ss
          JOIN subscription_features sf ON ss.id = sf.service_id
          WHERE ss.name = ${serviceName}
            AND sf.feature_type = 'limit'
            AND (sf.name LIKE '%_limit%' OR sf.name LIKE '%_generations%' OR sf.name LIKE '%_slots%')
            AND ss.is_active = true
          LIMIT 1
        )
        SELECT us.plan_id, sf.feature_id, sf.service_display_name
        FROM user_subscription us, service_feature sf
      `;

      if (subscriptionData.length === 0) {
        throw new Error('User subscription or service feature not found');
      }

      const { plan_id, feature_id } = subscriptionData[0];
      const featureValue = isUnlimited ? '-1' : (quotaLimit || 0).toString();

      // Update or insert the plan feature value
      const updateResult = await sql`
        INSERT INTO plan_feature_values (plan_id, feature_id, feature_value, created_at)
        VALUES (${plan_id}, ${feature_id}, ${featureValue}, NOW())
        ON CONFLICT (plan_id, feature_id)
        DO UPDATE SET 
          feature_value = ${featureValue},
          created_at = NOW()
        RETURNING *
      `;

      return { success: true, affectedRows: updateResult.length };
    });

    return result;
  } catch (error) {
    console.error('Quota update error:', error);
    return { success: false, affectedRows: 0 };
  }
}

// ================================
// API HANDLERS
// ================================

/**
 * GET /api/admin/users/[id]/quotas
 * Retrieves user quota information with comprehensive data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<{ quotas: UserQuotaData[] }> | ErrorResponse>> {
  try {
    // Validate session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate admin permissions
    const isAdmin = await validateAdminAccess(session.user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Validate and parse parameters
    const paramsResult = ParamsSchema.safeParse(params);
    if (!paramsResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid user ID format',
          data: paramsResult.error.issues 
        },
        { status: 400 }
      );
    }

    const userId = parseInt(paramsResult.data.id);

    // Verify user exists
    const userExists = await sql`
      SELECT id FROM users WHERE id = ${userId} LIMIT 1
    `;

    if (userExists.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch quota data
    const quotas = await fetchUserQuotas(userId);

    return NextResponse.json({
      success: true,
      data: { quotas },
      message: `Retrieved ${quotas.length} quota records`
    });

  } catch (error) {
    console.error('GET /api/admin/users/[id]/quotas error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: 'Failed to retrieve user quotas'
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users/[id]/quotas
 * Updates user quota limits with comprehensive validation and logging
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<{ updated: boolean; previous_value?: string }> | ErrorResponse>> {
  try {
    // Validate session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate admin permissions
    const isAdmin = await validateAdminAccess(session.user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Validate parameters
    const paramsResult = ParamsSchema.safeParse(params);
    if (!paramsResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid user ID format',
          data: paramsResult.error.issues 
        },
        { status: 400 }
      );
    }

    const userId = parseInt(paramsResult.data.id);

    // Validate request body
    const body = await request.json();
    const bodyResult = UpdateQuotaSchema.safeParse(body);
    
    if (!bodyResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data',
          data: bodyResult.error.issues 
        },
        { status: 400 }
      );
    }

    const { service_name, quota_limit, is_unlimited, reason } = bodyResult.data;

    // Verify user exists
    const userExists = await sql`
      SELECT id, email, name FROM users WHERE id = ${userId} LIMIT 1
    `;

    if (userExists.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get current quota value for logging
    const currentQuotas = await fetchUserQuotas(userId);
    const currentQuota = currentQuotas.find(q => q.service_name === service_name);

    // Update the quota
    const updateResult = await updateUserQuota(
      userId,
      service_name,
      quota_limit,
      is_unlimited
    );

    if (!updateResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to update quota',
          message: 'Service or user subscription not found'
        },
        { status: 400 }
      );
    }

    // Log the admin action
    await logAdminAction(
      session.user.id,
      userId,
      'quota_update',
      {
        service_name,
        previous_quota: currentQuota?.quota_limit || 0,
        new_quota: is_unlimited ? -1 : quota_limit,
        is_unlimited,
        user_email: userExists[0].email,
        user_name: userExists[0].name
      },
      reason
    );

    // SSE notifications removed - admin panel now uses polling for updates

    return NextResponse.json({
      success: true,
      data: {
        updated: true,
        previous_value: currentQuota ? 
          (currentQuota.is_unlimited ? 'unlimited' : currentQuota.quota_limit.toString()) : 
          'unknown'
      },
      message: `Quota updated successfully for ${service_name}`
    });

  } catch (error) {
    console.error('PATCH /api/admin/users/[id]/quotas error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: 'Failed to update user quota'
      },
      { status: 500 }
    );
  }
} 