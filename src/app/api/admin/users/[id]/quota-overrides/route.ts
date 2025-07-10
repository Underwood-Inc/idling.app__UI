/**
 * User Quota Overrides API
 * 
 * Provides secure endpoints for managing user quota overrides
 * with integration to the enhanced quota system.
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

interface UserQuotaOverride {
  id: number;
  user_id: number;
  service_name: string;
  feature_name: string;
  quota_limit: number | null;
  is_unlimited: boolean;
  reset_period: string;
  is_active: boolean;
  reason: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

const UpdateQuotaOverrideSchema = z.object({
  service_name: z.string().min(1),
  feature_name: z.string().min(1),
  quota_limit: z.number().int().min(0).optional(),
  is_unlimited: z.boolean().default(false),
  reset_period: z.enum(['hourly', 'daily', 'weekly', 'monthly']).default('daily'),
  reason: z.string().max(500).optional()
}).transform((data) => {
  // If quota_limit is 0, treat as unlimited
  if (data.quota_limit === 0) {
    return {
      ...data,
      is_unlimited: true
    };
  }
  return data;
});

const DeleteQuotaOverrideSchema = z.object({
  service_name: z.string().min(1),
  feature_name: z.string().min(1)
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
      SELECT 1 FROM users WHERE id = ${userId}
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
 * PUT /api/admin/users/[id]/quota-overrides
 * Creates or updates a user quota override
 */
async function putHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<{ override: UserQuotaOverride }> | ErrorResponse>> {
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
    const validationResult = UpdateQuotaOverrideSchema.safeParse(body);
    
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

    const { service_name, feature_name, quota_limit, is_unlimited, reset_period, reason } = validationResult.data;

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

    // Calculate final quota limit - treat 0 as unlimited
    const finalIsUnlimited = is_unlimited || quota_limit === 0;
    const finalQuotaLimit = finalIsUnlimited ? -1 : (quota_limit || 1);
    const finalResetPeriod = reset_period || 'daily';

    // Check if override already exists
    const existingOverride = await sql`
      SELECT id FROM user_quota_overrides
      WHERE user_id = ${params.id} 
      AND service_name = ${service_name} 
      AND feature_name = ${feature_name}
    `;

    let override;
    
    if (existingOverride.length > 0) {
      // Update existing override
      override = await sql`
        UPDATE user_quota_overrides 
        SET 
          quota_limit = ${finalQuotaLimit},
          is_unlimited = ${finalIsUnlimited},
          reset_period = ${finalResetPeriod},
          reason = ${reason || null},
          updated_at = NOW()
        WHERE id = ${existingOverride[0].id}
        RETURNING *
      `;
    } else {
      // Create new override
      override = await sql`
        INSERT INTO user_quota_overrides (
          user_id, service_name, feature_name, quota_limit, 
          is_unlimited, reset_period, reason, created_by, is_active
        ) VALUES (
          ${params.id}, ${service_name}, ${feature_name}, ${finalQuotaLimit},
          ${finalIsUnlimited}, ${finalResetPeriod}, ${reason || null}, ${parseInt(session.user.id)}, true
        )
        RETURNING *
      `;
    }

    // Log the admin action
    await logAdminAction(
      parseInt(session.user.id),
      'user_quota_override',
      {
        target_user_id: params.id,
        service_name,
        feature_name,
        quota_limit: finalQuotaLimit,
        is_unlimited,
        reset_period: finalResetPeriod,
        service_display_name: serviceFeatureExists[0].service_display_name,
        feature_display_name: serviceFeatureExists[0].feature_display_name
      },
      reason || `Updated quota override for ${service_name}.${feature_name}`
    );

    const actionType = existingOverride.length > 0 ? 'updated' : 'created';
    const serviceName = serviceFeatureExists[0].service_display_name;
    const featureName = serviceFeatureExists[0].feature_display_name;

    return NextResponse.json({
      success: true,
      data: { override: override[0] as unknown as UserQuotaOverride },
      message: `Quota override ${actionType} for ${serviceName} - ${featureName}`
    });

  } catch (error) {
    console.error('PUT /api/admin/users/[id]/quota-overrides error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: 'Failed to update user quota override'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]/quota-overrides
 * Removes a user quota override
 */
async function deleteHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<{ deleted: boolean }> | ErrorResponse>> {
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
    const validationResult = DeleteQuotaOverrideSchema.safeParse(body);
    
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

    const { service_name, feature_name } = validationResult.data;

    // Get override details for logging
    const overrideDetails = await sql`
      SELECT * FROM user_quota_overrides
      WHERE user_id = ${params.id} 
      AND service_name = ${service_name} 
      AND feature_name = ${feature_name}
    `;

    if (overrideDetails.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Quota override not found' },
        { status: 404 }
      );
    }

    // Delete the override
    const deleteResult = await sql`
      DELETE FROM user_quota_overrides
      WHERE user_id = ${params.id} 
      AND service_name = ${service_name} 
      AND feature_name = ${feature_name}
      RETURNING id
    `;

    if (deleteResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete quota override' },
        { status: 500 }
      );
    }

    // Log the admin action
    await logAdminAction(
      parseInt(session.user.id),
      'user_quota_override_remove',
      {
        target_user_id: params.id,
        service_name,
        feature_name,
        removed_override: overrideDetails[0]
      },
      `Removed quota override for ${service_name}.${feature_name}`
    );

    return NextResponse.json({
      success: true,
      data: { deleted: true },
      message: `Quota override removed for ${service_name}.${feature_name}`
    });

  } catch (error) {
    console.error('DELETE /api/admin/users/[id]/quota-overrides error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: 'Failed to delete user quota override'
      },
      { status: 500 }
    );
  }
}

// Apply rate limiting to handlers
export const PUT = withRateLimit(putHandler);
export const DELETE = withRateLimit(deleteHandler);

// Removed default export - Next.js API routes should only use named exports 