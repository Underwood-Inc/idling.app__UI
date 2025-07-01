/**
 * User Quota Reset API
 * 
 * Provides secure endpoint for resetting user quota usage counts
 * while preserving the quota limits themselves.
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
  data?: any;
}

// ================================
// HELPER FUNCTIONS
// ================================

async function validateAdminAccess(userId: string): Promise<boolean> {
  try {
    const adminCheck = await sql`
      SELECT ura.role_id, ur.name as role_name
      FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = ${userId}
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

async function validateUserExists(userId: string): Promise<boolean> {
  try {
    const userCheck = await sql`
      SELECT EXISTS(SELECT 1 FROM users WHERE id = ${userId}) as user_exists
    `;
    return userCheck[0]?.user_exists || false;
  } catch (error) {
    console.error('User validation error:', error);
    return false;
  }
}

async function logAdminAction(
  adminUserId: string,
  action: string,
  details: any,
  reason?: string
): Promise<void> {
  try {
    await sql`
      INSERT INTO admin_actions (
        admin_user_id, action_type, action_details, reason, created_at
      ) VALUES (
        ${adminUserId}, ${action}, ${JSON.stringify(details)}, ${reason || null}, NOW()
      )
    `;
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}

// ================================
// API HANDLERS
// ================================

/**
 * POST /api/admin/users/[id]/quotas/reset
 * Resets user quota usage counts to zero while preserving limits
 */
export async function POST(
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
    const isAdmin = await validateAdminAccess(session.user.id);
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
      FROM subscription_usage
      WHERE user_id = ${params.id}
      AND service_name = ${service_name}
      AND feature_name = ${feature_name}
      AND usage_date >= CURRENT_DATE
    `;

    const previousUsage = parseInt(currentUsage[0]?.total_usage || '0');

    // Reset usage in subscription_usage table (for authenticated users)
    const resetResult = await sql`
      DELETE FROM subscription_usage
      WHERE user_id = ${params.id}
      AND service_name = ${service_name}
      AND feature_name = ${feature_name}
      AND usage_date >= CURRENT_DATE
    `;

    // Also reset guest usage if this user has IP-based records
    // (in case they were using the system before logging in)
    const userInfo = await sql`
      SELECT email FROM users WHERE id = ${params.id}
    `;

    // Log the admin action
    await logAdminAction(
      session.user.id,
      'user_quota_reset',
      {
        target_user_id: params.id,
        target_user_email: userInfo[0]?.email,
        service_name,
        feature_name,
        previous_usage: previousUsage,
        reset_count: resetResult.count,
        service_display_name: serviceFeatureExists[0].service_display_name,
        feature_display_name: serviceFeatureExists[0].feature_display_name
      },
      reason || `Reset quota usage for ${service_name}.${feature_name}`
    );

    const serviceName = serviceFeatureExists[0].service_display_name;
    const featureName = serviceFeatureExists[0].feature_display_name;

    return NextResponse.json({
      success: true,
      data: {
        reset: true,
        previous_usage: previousUsage 
      },
      message: `Usage reset for ${serviceName} - ${featureName}. Previous usage: ${previousUsage}`
    });

  } catch (error) {
    console.error('POST /api/admin/users/[id]/quotas/reset error:', error);
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