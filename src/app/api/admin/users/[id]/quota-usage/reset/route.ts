/**
 * User Quota Usage Reset API
 * 
 * Provides secure endpoint for resetting user quota usage counts
 * while preserving the quota limits themselves.
 * 
 * @version 1.0.0
 * @author System
 */

import { auth } from '@/lib/auth';
import sql from '@/lib/db';
import { withRateLimit } from '@/lib/middleware/withRateLimit';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ================================
// TYPES & SCHEMAS
// ================================

const ResetUserQuotaSchema = z.object({
  service_name: z.string().min(1),
  feature_name: z.string().min(1),
  reason: z.string().max(500).optional()
});

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

async function validateAdminAccess(userId: number): Promise<boolean> {
  try {
    const result = await sql`
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      JOIN role_permissions rp ON ur.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE ura.user_id = ${userId}
      AND ur.is_active = true
      AND p.name = 'admin:manage_users'
      AND p.is_active = true
      LIMIT 1
    `;
    return result.length > 0;
  } catch (error) {
    console.error('Error validating admin access:', error);
    return false;
  }
}

async function validateUserExists(userId: string): Promise<boolean> {
  try {
    const result = await sql`
      SELECT 1 FROM users WHERE id = ${parseInt(userId)}
    `;
    return result.length > 0;
  } catch (error) {
    console.error('Error validating user exists:', error);
    return false;
  }
}

async function logAdminAction(
  adminUserId: number,
  actionType: string,
  actionDetails: any,
  reason: string
): Promise<void> {
  try {
    await sql`
      INSERT INTO admin_actions (
        admin_user_id, action_type, action_details, reason, created_at
      ) VALUES (
        ${adminUserId}, ${actionType}, ${JSON.stringify(actionDetails)}, ${reason}, NOW()
      )
    `;
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
}

// ================================
// API HANDLERS
// ================================

/**
 * POST /api/admin/users/[id]/quota-usage/reset
 * Resets user quota usage counts to zero while preserving limits
 */
async function postHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<{ reset: boolean; previous_usage: number }> | ErrorResponse>> {
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
    const isAdmin = await validateAdminAccess(parseInt(session.user.id));
    if (!isAdmin) {
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

    // Validate request body
    const body = await request.json();
    const validationResult = ResetUserQuotaSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data',
          data: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    const { service_name, feature_name, reason } = validationResult.data;

    // Verify service and feature exist
    const serviceFeatureExists = await sql`
      SELECT ss.display_name as service_display_name, sf.display_name as feature_display_name
      FROM subscription_services ss
      JOIN subscription_features sf ON ss.id = sf.service_id
      WHERE ss.name = ${service_name} AND sf.name = ${feature_name}
      AND ss.is_active = true
    `;

    if (serviceFeatureExists.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Service or feature not found or inactive' },
        { status: 404 }
      );
    }

    // Get current usage before reset
    const currentUsage = await sql`
      SELECT COALESCE(SUM(usage_count), 0) as total_usage
      FROM subscription_usage su
      JOIN subscription_services ss ON su.service_id = ss.id
      JOIN subscription_features sf ON su.feature_id = sf.id
      WHERE su.user_id = ${parseInt(params.id)}
      AND ss.name = ${service_name}
      AND sf.name = ${feature_name}
      AND su.usage_date >= CURRENT_DATE - INTERVAL '30 days'
    `;

    const previousUsage = currentUsage[0]?.total_usage || 0;

    // Reset usage by deleting recent usage records
    const resetResult = await sql`
      DELETE FROM subscription_usage su
      USING subscription_services ss, subscription_features sf
      WHERE su.service_id = ss.id
      AND su.feature_id = sf.id
      AND su.user_id = ${parseInt(params.id)}
      AND ss.name = ${service_name}
      AND sf.name = ${feature_name}
      AND su.usage_date >= CURRENT_DATE - INTERVAL '30 days'
    `;

    // Log the admin action
    await logAdminAction(
      parseInt(session.user.id),
      'user_quota_usage_reset',
      {
        target_user_id: parseInt(params.id),
        service_name,
        feature_name,
        previous_usage: previousUsage,
        service_display_name: serviceFeatureExists[0].service_display_name,
        feature_display_name: serviceFeatureExists[0].feature_display_name
      },
      reason || `Reset quota usage for ${service_name}.${feature_name}`
    );

    return NextResponse.json({
      success: true,
      data: { 
        reset: true, 
        previous_usage: previousUsage 
      },
      message: `Usage reset for ${serviceFeatureExists[0].service_display_name} - ${serviceFeatureExists[0].feature_display_name} (was ${previousUsage})`
    });

  } catch (error) {
    console.error('POST /api/admin/users/[id]/quota-usage/reset error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: 'Failed to reset user quota usage'
      },
      { status: 500 }
    );
  }
}

// Apply rate limiting to handler
export const POST = withRateLimit(postHandler); 