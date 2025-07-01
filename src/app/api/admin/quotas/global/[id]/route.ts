/**
 * Individual Global Guest Quota Management API
 * 
 * Provides secure endpoints for managing specific global quota settings by ID
 * with proper validation and admin action logging.
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

// ================================
// API HANDLERS
// ================================

/**
 * PUT /api/admin/quotas/global/[id]
 * Updates an existing global guest quota
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Validate quota ID
    const quotaId = parseInt(params.id);
    if (isNaN(quotaId) || quotaId <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid quota ID' },
        { status: 400 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validationResult = UpdateGlobalQuotaSchema.safeParse(body);
    
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

    const updates = validationResult.data;

    // Check if quota exists
    const existingQuota = await sql`
      SELECT ggq.*, ss.display_name as service_display_name, sf.display_name as feature_display_name
      FROM global_guest_quotas ggq
      JOIN subscription_services ss ON ggq.service_name = ss.name
      JOIN subscription_features sf ON ggq.feature_name = sf.name AND sf.service_id = ss.id
      WHERE ggq.id = ${quotaId}
    `;

    if (existingQuota.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Global quota not found' },
        { status: 404 }
      );
    }

    const currentQuota = existingQuota[0];

    // Build update query dynamically
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    // Handle quota_limit and is_unlimited together to support 0 as infinite
    const isBecomingUnlimited = updates.is_unlimited || updates.quota_limit === 0;
    
    if (updates.quota_limit !== undefined) {
      const finalQuotaLimit = isBecomingUnlimited ? -1 : updates.quota_limit;
      updateFields.push(`quota_limit = $${paramIndex++}`);
      updateValues.push(finalQuotaLimit);
    }

    if (updates.is_unlimited !== undefined || updates.quota_limit === 0) {
      updateFields.push(`is_unlimited = $${paramIndex++}`);
      updateValues.push(isBecomingUnlimited);
      
      // If setting to unlimited but quota_limit wasn't provided, also set quota_limit to -1
      if (isBecomingUnlimited && updates.quota_limit === undefined) {
        updateFields.push(`quota_limit = $${paramIndex++}`);
        updateValues.push(-1);
      }
    }

    if (updates.reset_period !== undefined) {
      updateFields.push(`reset_period = $${paramIndex++}`);
      updateValues.push(updates.reset_period);
    }

    if (updates.description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      updateValues.push(updates.description);
    }

    if (updates.is_active !== undefined) {
      updateFields.push(`is_active = $${paramIndex++}`);
      updateValues.push(updates.is_active);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Add updated_at field
    updateFields.push(`updated_at = NOW()`);
    updateValues.push(quotaId); // Add quota ID for WHERE clause

    // Execute update
    const updateQuery = `
      UPDATE global_guest_quotas 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const updatedQuota = await sql.unsafe(updateQuery, updateValues);

    // Log the admin action
    await logAdminAction(
      session.user.id,
      'global_quota_update',
      {
        quota_id: quotaId,
        service_name: currentQuota.service_name,
        feature_name: currentQuota.feature_name,
        service_display_name: currentQuota.service_display_name,
        feature_display_name: currentQuota.feature_display_name,
        old_values: {
          quota_limit: currentQuota.quota_limit,
          is_unlimited: currentQuota.is_unlimited,
          reset_period: currentQuota.reset_period,
          description: currentQuota.description,
          is_active: currentQuota.is_active
        },
        new_values: updates
      },
      `Updated global guest quota for ${currentQuota.service_name}.${currentQuota.feature_name}`
    );

    return NextResponse.json({
      success: true,
      data: { quota: updatedQuota[0] as unknown as GlobalGuestQuota },
      message: `Global quota updated for ${currentQuota.service_display_name} - ${currentQuota.feature_display_name}`
    });

  } catch (error) {
    console.error('PUT /api/admin/quotas/global/[id] error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: 'Failed to update global quota'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/quotas/global/[id]
 * Deletes a global guest quota (removes quota limits for that service/feature)
 */
export async function DELETE(
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
    const isAdmin = await validateAdminAccess(session.user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Validate quota ID
    const quotaId = parseInt(params.id);
    if (isNaN(quotaId) || quotaId <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid quota ID' },
        { status: 400 }
      );
    }

    // Check if quota exists and get details for logging
    const existingQuota = await sql`
      SELECT ggq.*, ss.display_name as service_display_name, sf.display_name as feature_display_name
      FROM global_guest_quotas ggq
      JOIN subscription_services ss ON ggq.service_name = ss.name
      JOIN subscription_features sf ON ggq.feature_name = sf.name AND sf.service_id = ss.id
      WHERE ggq.id = ${quotaId}
    `;

    if (existingQuota.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Global quota not found' },
        { status: 404 }
      );
    }

    const quotaToDelete = existingQuota[0];

    // Delete the quota
    const deleteResult = await sql`
      DELETE FROM global_guest_quotas 
      WHERE id = ${quotaId}
      RETURNING id
    `;

    if (deleteResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete global quota' },
        { status: 500 }
      );
    }

    // Log the admin action
    await logAdminAction(
      session.user.id,
      'global_quota_delete',
      {
        quota_id: quotaId,
        service_name: quotaToDelete.service_name,
        feature_name: quotaToDelete.feature_name,
        service_display_name: quotaToDelete.service_display_name,
        feature_display_name: quotaToDelete.feature_display_name,
        deleted_quota: {
          quota_limit: quotaToDelete.quota_limit,
          is_unlimited: quotaToDelete.is_unlimited,
          reset_period: quotaToDelete.reset_period,
          description: quotaToDelete.description,
          is_active: quotaToDelete.is_active
        }
      },
      `Deleted global guest quota for ${quotaToDelete.service_name}.${quotaToDelete.feature_name}`
    );

    return NextResponse.json({
      success: true,
      data: { deleted: true },
      message: `Global quota deleted for ${quotaToDelete.service_display_name} - ${quotaToDelete.feature_display_name}`
    });

  } catch (error) {
    console.error('DELETE /api/admin/quotas/global/[id] error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: 'Failed to delete global quota'
      },
      { status: 500 }
    );
  }
} 