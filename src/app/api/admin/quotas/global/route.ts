/**
 * Global Guest Quota Management API
 * 
 * Provides secure endpoints for managing global quota settings for anonymous/guest users
 * with feature-level granularity to prevent unintended impacts on other systems.
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

interface GlobalGuestQuota {
  id: number;
  service_name: string;
  feature_name: string;
  quota_limit: number;
  is_unlimited: boolean;
  reset_period: string;
  is_active: boolean;
  description: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

interface ServiceFeature {
  service_name: string;
  service_display_name: string;
  feature_name: string;
  feature_display_name: string;
  feature_type: string;
  current_quota: number | null;
  is_unlimited: boolean;
  reset_period: string;
  is_active: boolean;
}

const CreateGlobalQuotaSchema = z.object({
  service_name: z.string().min(1).max(50),
  feature_name: z.string().min(1).max(100),
  quota_limit: z.number().int().min(0).optional(),
  is_unlimited: z.boolean().default(false),
  reset_period: z.enum(['hourly', 'daily', 'weekly', 'monthly']).default('daily'),
  description: z.string().max(500).optional(),
  is_active: z.boolean().default(true)
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

const UpdateGlobalQuotaSchema = z.object({
  quota_limit: z.number().int().min(0).optional(),
  is_unlimited: z.boolean().optional(),
  reset_period: z.enum(['hourly', 'daily', 'weekly', 'monthly']).optional(),
  description: z.string().max(500).optional(),
  is_active: z.boolean().optional()
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

const ParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Invalid quota ID')
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

async function getAvailableServiceFeatures(): Promise<ServiceFeature[]> {
  const features = await sql`
    SELECT 
      ss.name as service_name,
      ss.display_name as service_display_name,
      sf.name as feature_name,
      sf.display_name as feature_display_name,
      sf.feature_type,
      ggq.quota_limit as current_quota,
      COALESCE(ggq.is_unlimited, false) as is_unlimited,
      COALESCE(ggq.reset_period, 'daily') as reset_period,
      COALESCE(ggq.is_active, false) as is_active
    FROM subscription_services ss
    JOIN subscription_features sf ON ss.id = sf.service_id
    LEFT JOIN global_guest_quotas ggq ON ss.name = ggq.service_name AND sf.name = ggq.feature_name
    WHERE sf.feature_type = 'limit'
    AND (sf.name LIKE '%_limit%' OR sf.name LIKE '%_generations%' OR sf.name LIKE '%_slots%' OR sf.name LIKE '%_requests%')
    AND ss.is_active = true
    ORDER BY ss.display_name, sf.display_name
  `;

  return features.map((feature: any): ServiceFeature => ({
    service_name: feature.service_name,
    service_display_name: feature.service_display_name,
    feature_name: feature.feature_name,
    feature_display_name: feature.feature_display_name,
    feature_type: feature.feature_type,
    current_quota: feature.current_quota,
    is_unlimited: feature.is_unlimited,
    reset_period: feature.reset_period,
    is_active: feature.is_active
  }));
}

// ================================
// API HANDLERS
// ================================

/**
 * GET /api/admin/quotas/global
 * Retrieves all global guest quotas with available service/feature options
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ quotas: GlobalGuestQuota[]; available_features: ServiceFeature[] }> | ErrorResponse>> {
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

    // Get all global guest quotas
    const quotas = await sql`
      SELECT 
        ggq.*,
        ss.display_name as service_display_name,
        sf.display_name as feature_display_name
      FROM global_guest_quotas ggq
      JOIN subscription_services ss ON ggq.service_name = ss.name
      JOIN subscription_features sf ON ggq.feature_name = sf.name AND sf.service_id = ss.id
      ORDER BY ss.display_name, sf.display_name
    `;

    // Get available service/feature combinations
    const availableFeatures = await getAvailableServiceFeatures();

    return NextResponse.json({
      success: true,
      data: {
        quotas: quotas as unknown as GlobalGuestQuota[],
        available_features: availableFeatures
      },
      message: `Retrieved ${quotas.length} global quotas and ${availableFeatures.length} available features`
    });

  } catch (error) {
    console.error('GET /api/admin/quotas/global error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: 'Failed to retrieve global quotas'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/quotas/global
 * Creates a new global guest quota for a specific service/feature
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ quota: GlobalGuestQuota }> | ErrorResponse>> {
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

    // Validate request body
    const body = await request.json();
    const validationResult = CreateGlobalQuotaSchema.safeParse(body);
    
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

    const { service_name, feature_name, quota_limit, is_unlimited, reset_period, description, is_active } = validationResult.data;

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

    // Check if quota already exists
    const existingQuota = await sql`
      SELECT id FROM global_guest_quotas 
      WHERE service_name = ${service_name} AND feature_name = ${feature_name}
    `;

    if (existingQuota.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Global quota for this service/feature already exists' },
        { status: 409 }
      );
    }

    // Create the quota - treat 0 as unlimited
    const finalQuotaLimit = is_unlimited || quota_limit === 0 ? -1 : (quota_limit || 1);
    const finalIsUnlimited = is_unlimited || quota_limit === 0;
    
    const newQuota = await sql`
      INSERT INTO global_guest_quotas (
        service_name, feature_name, quota_limit, is_unlimited, 
        reset_period, description, is_active, created_by
      ) VALUES (
        ${service_name}, ${feature_name}, ${finalQuotaLimit}, ${finalIsUnlimited},
        ${reset_period}, ${description || null}, ${is_active}, ${session.user.id}
      )
      RETURNING *
    `;

    // Log the admin action
    await logAdminAction(
      session.user.id,
      'global_quota_create',
      {
        service_name,
        feature_name,
        quota_limit: finalQuotaLimit,
        is_unlimited,
        reset_period,
        service_display_name: serviceFeatureExists[0].service_display_name,
        feature_display_name: serviceFeatureExists[0].feature_display_name
      },
      `Created global guest quota for ${service_name}.${feature_name}`
    );

    return NextResponse.json({
      success: true,
      data: { quota: newQuota[0] as GlobalGuestQuota },
      message: `Global quota created for ${serviceFeatureExists[0].service_display_name} - ${serviceFeatureExists[0].feature_display_name}`
    });

  } catch (error) {
    console.error('POST /api/admin/quotas/global error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: 'Failed to create global quota'
      },
      { status: 500 }
    );
  }
} 