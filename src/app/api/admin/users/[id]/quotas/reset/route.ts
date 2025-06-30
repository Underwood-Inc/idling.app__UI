/**
 * User Quota Reset API
 * 
 * Provides secure endpoints for resetting user quota usage counts
 * while maintaining audit trails and proper validation.
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
const ResetQuotaSchema = z.object({
  service_name: z.string().min(1, 'Service name is required'),
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
 * Resets quota usage for a specific service
 */
async function resetServiceQuotaUsage(
  userId: number,
  serviceName: string
): Promise<{ success: boolean; previousUsage: number; affectedRows: number }> {
  try {
    // Get current usage before reset
    const currentUsage = await sql`
      SELECT COALESCE(su.usage_count, 0) as current_usage
      FROM subscription_services ss
      LEFT JOIN subscription_usage su ON ss.id = su.service_id 
        AND su.user_id = ${userId}
        AND su.usage_date = CURRENT_DATE
      WHERE ss.name = ${serviceName}
      AND ss.is_active = true
      LIMIT 1
    `;

    const previousUsage = parseInt(currentUsage[0]?.current_usage) || 0;

    if (previousUsage === 0) {
      return { success: true, previousUsage: 0, affectedRows: 0 };
    }

    // Reset the usage count
    const resetResult = await sql`
      UPDATE subscription_usage 
      SET usage_count = 0, updated_at = NOW()
      WHERE user_id = ${userId}
      AND service_id = (SELECT id FROM subscription_services WHERE name = ${serviceName})
      AND usage_date = CURRENT_DATE
      AND usage_count > 0
    `;

    return { 
      success: true, 
      previousUsage, 
      affectedRows: resetResult.length 
    };

  } catch (error) {
    console.error('Quota reset error:', error);
    return { success: false, previousUsage: 0, affectedRows: 0 };
  }
}

// ================================
// API HANDLERS
// ================================

/**
 * POST /api/admin/users/[id]/quotas/reset
 * Resets user quota usage with comprehensive validation and logging
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
    const bodyResult = ResetQuotaSchema.safeParse(body);
    
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

    const { service_name, reason } = bodyResult.data;

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

    // Verify service exists
    const serviceExists = await sql`
      SELECT id, display_name FROM subscription_services 
      WHERE name = ${service_name} AND is_active = true 
      LIMIT 1
    `;

    if (serviceExists.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Service not found or inactive' },
        { status: 404 }
      );
    }

    // Reset the quota usage
    const resetResult = await resetServiceQuotaUsage(userId, service_name);

    if (!resetResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to reset quota usage',
          message: 'An internal error occurred during the reset operation'
        },
        { status: 500 }
      );
    }

    // Log the admin action
    await logAdminAction(
      session.user.id,
      userId,
      'quota_reset',
      {
        service_name,
        service_display_name: serviceExists[0].display_name,
        previous_usage: resetResult.previousUsage,
        user_email: userExists[0].email,
        user_name: userExists[0].name
      },
      reason
    );

    return NextResponse.json({
      success: true,
      data: {
        reset: true,
        previous_usage: resetResult.previousUsage
      },
      message: resetResult.previousUsage === 0 
        ? 'Usage was already at 0' 
        : `Usage reset from ${resetResult.previousUsage} to 0`
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