/**
 * Individual User Quota Management API
 * 
 * Provides secure endpoints for managing specific user quota settings
 * with integration to the enhanced quota system.
 * 
 * @version 1.0.0
 * @author System
 */

import { auth } from '@/lib/auth';
import sql from '@/lib/db';
import { EnhancedQuotaService } from '@/lib/services/EnhancedQuotaService';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ================================
// TYPES & SCHEMAS
// ================================

interface UserQuotaData {
  service_name: string;
  feature_name: string;
  display_name: string;
  current_usage: number;
  quota_limit: number;
  is_unlimited: boolean;
  is_custom: boolean;
  reset_date: string;
  quota_source: string;
  reset_period: string;
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
  reason: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

const UpdateUserQuotaSchema = z.object({
  service_name: z.string().min(1),
  feature_name: z.string().min(1),
  quota_limit: z.number().int().min(0).optional(),
  is_unlimited: z.boolean().default(false),
  reset_period: z.enum(['hourly', 'daily', 'weekly', 'monthly']).optional(),
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
 * GET /api/admin/users/[id]/quotas
 * Retrieves comprehensive quota information for a specific user
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
    
    // Get additional display information
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

    // Get existing user overrides
    const userOverrides = await sql`
      SELECT * FROM user_quota_overrides
      WHERE user_id = ${params.id} AND is_active = true
    `;

    // Build comprehensive quota data
    const quotaData: UserQuotaData[] = [];
    
    for (const info of quotaInfo) {
      const serviceFeature = serviceFeatures.find(
        sf => sf.service_name === info.service_name && sf.feature_name === info.feature_name
      );
      
      const override = userOverrides.find(
        uo => uo.service_name === info.service_name && uo.feature_name === info.feature_name
      );

      quotaData.push({
        service_name: info.service_name,
        feature_name: info.feature_name,
        display_name: serviceFeature ? 
          `${serviceFeature.service_display_name} - ${serviceFeature.feature_display_name}` : 
          `${info.service_name} - ${info.feature_name}`,
        current_usage: info.current_usage,
        quota_limit: info.quota_limit,
        is_unlimited: info.is_unlimited,
        is_custom: !!override,
        reset_date: info.reset_date?.toISOString() || new Date(Date.now() + 86400000).toISOString(),
        quota_source: info.quota_source,
        reset_period: info.reset_period
      });
    }

    return NextResponse.json({
      success: true,
      data: { quotas: quotaData },
      message: `Retrieved ${quotaData.length} quota entries for user`
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
 * Updates or creates a user quota override
 */
export async function PATCH(
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
    const validationResult = UpdateUserQuotaSchema.safeParse(body);
    
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
    const finalResetPeriod = reset_period || 'monthly';

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
          ${finalIsUnlimited}, ${finalResetPeriod}, ${reason || null}, ${session.user.id}, true
        )
        RETURNING *
      `;
    }

    // Log the admin action
    await logAdminAction(
      session.user.id,
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