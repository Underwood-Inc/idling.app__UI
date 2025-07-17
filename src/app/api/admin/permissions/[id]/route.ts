/**
 * Admin Individual Permission Management API
 * Handles update, disable, archive operations for specific permissions
 *
 * @author System Wizard 🧙‍♂️
 * @version 1.0.0
 */

import { checkUserPermission } from '@lib/actions/permissions.actions';
import { withUniversalEnhancements } from '@lib/api/withUniversalEnhancements';
import { auth } from '@lib/auth';
import sql from '@lib/db';
import { PERMISSIONS } from '@lib/permissions/permissions';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';

// ================================
// SCHEMAS
// ================================

const PermissionIdSchema = z.object({
  id: z.coerce.number().positive()
});

const PermissionUpdateSchema = z.object({
  display_name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  category: z.string().min(1).max(50).optional(),
  is_inheritable: z.boolean().optional(),
  is_active: z.boolean().optional(),
  risk_level: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  sort_order: z.number().min(0).optional(),
  dependencies: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
  reason: z.string().optional()
});

const PermissionArchiveSchema = z.object({
  reason: z.string().min(1).max(500)
});

// ================================
// HANDLERS
// ================================

/**
 * GET /api/admin/permissions/[id] - Get specific permission with details
 */
async function getHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const hasPermission = await checkUserPermission(
      userId,
      PERMISSIONS.ADMIN.PERMISSIONS_VIEW
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = PermissionIdSchema.parse({ id: params.id });

    // Get permission with detailed stats
    const permission = await sql`
      SELECT 
        p.*,
        COALESCE(role_stats.role_count, 0) as role_count,
        COALESCE(user_stats.user_count, 0) as user_count,
        COALESCE(usage_stats.recent_usage_count, 0) as recent_usage_count,
        archived_by_user.name as archived_by_name,
        archived_by_user.email as archived_by_email
      FROM permissions p
      LEFT JOIN (
        SELECT permission_id, COUNT(*) as role_count
        FROM role_permissions
        WHERE is_active = TRUE
        GROUP BY permission_id
      ) role_stats ON p.id = role_stats.permission_id
      LEFT JOIN (
        SELECT permission_id, COUNT(*) as user_count
        FROM user_permissions
        WHERE is_active = TRUE AND granted = TRUE
        GROUP BY permission_id
      ) user_stats ON p.id = user_stats.permission_id
      LEFT JOIN (
        SELECT permission_id, COUNT(*) as recent_usage_count
        FROM user_permissions
        WHERE is_active = TRUE AND granted_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
        GROUP BY permission_id
      ) usage_stats ON p.id = usage_stats.permission_id
      LEFT JOIN users archived_by_user ON p.archived_by = archived_by_user.id
      WHERE p.id = ${id}
    `;

    if (permission.length === 0) {
      return NextResponse.json(
        { error: 'Permission not found' },
        { status: 404 }
      );
    }

    // Get roles that have this permission
    const roles = await sql`
      SELECT 
        ur.id, ur.name, ur.display_name, ur.role_color, ur.role_icon,
        rp.granted_at, rp.granted_by, granted_by_user.name as granted_by_name
      FROM role_permissions rp
      JOIN user_roles ur ON rp.role_id = ur.id
      LEFT JOIN users granted_by_user ON rp.granted_by = granted_by_user.id
      WHERE rp.permission_id = ${id} AND rp.is_active = TRUE
      ORDER BY ur.display_name
    `;

    // Get users with direct permission grants
    const users = await sql`
      SELECT 
        u.id, u.name, u.email, u.image,
        up.granted, up.granted_at, up.expires_at, up.reason,
        granted_by_user.name as granted_by_name
      FROM user_permissions up
      JOIN users u ON up.user_id = u.id
      LEFT JOIN users granted_by_user ON up.granted_by = granted_by_user.id
      WHERE up.permission_id = ${id} AND up.is_active = TRUE
      ORDER BY up.granted_at DESC
      LIMIT 20
    `;

    // Get recent audit history
    const auditHistory = await sql`
      SELECT 
        pa.action_type, pa.reason, pa.created_at,
        u.name as admin_name, u.email as admin_email
      FROM permissions_audit pa
      LEFT JOIN users u ON pa.admin_user_id = u.id
      WHERE pa.permission_id = ${id}
      ORDER BY pa.created_at DESC
      LIMIT 10
    `;

    return NextResponse.json({
      permission: permission[0],
      roles: roles,
      users: users,
      audit_history: auditHistory
    });
  } catch (error) {
    console.error('Error fetching permission:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid permission ID', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch permission' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/permissions/[id] - Update permission
 */
async function patchHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const hasPermission = await checkUserPermission(
      userId,
      PERMISSIONS.ADMIN.PERMISSIONS_MANAGE
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = PermissionIdSchema.parse({ id: params.id });
    const body = await request.json();
    const data = PermissionUpdateSchema.parse(body);

    // Check if permission exists
    const existingPermission = await sql`
      SELECT * FROM permissions WHERE id = ${id}
    `;

    if (existingPermission.length === 0) {
      return NextResponse.json(
        { error: 'Permission not found' },
        { status: 404 }
      );
    }

    const permission = existingPermission[0];

    // Check if it's a system permission and prevent certain changes
    if (permission.is_system) {
      if (data.is_active === false) {
        return NextResponse.json(
          { error: 'Cannot disable system permissions' },
          { status: 403 }
        );
      }
    }

    // Get old data for audit
    const oldData = permission;

    // Update permission
    const updatedPermission = await sql`
      UPDATE permissions 
      SET 
        display_name = COALESCE(${data.display_name ?? null}, display_name),
        description = COALESCE(${data.description ?? null}, description),
        category = COALESCE(${data.category ?? null}, category),
        is_inheritable = COALESCE(${data.is_inheritable ?? null}, is_inheritable),
        is_active = COALESCE(${data.is_active ?? null}, is_active),
        risk_level = COALESCE(${data.risk_level ?? null}, risk_level),
        sort_order = COALESCE(${data.sort_order ?? null}, sort_order),
        dependencies = COALESCE(${data.dependencies ?? null}, dependencies),
        metadata = COALESCE(${data.metadata ? JSON.stringify(data.metadata) : null}, metadata),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    // Log the action
    await sql`
      INSERT INTO permissions_audit (
        action_type, permission_id, admin_user_id, old_data, new_data, reason
      ) VALUES (
        'update', ${id}, ${userId}, 
        ${JSON.stringify(oldData)}, ${JSON.stringify(updatedPermission[0])}, 
        ${data.reason || 'Permission updated'}
      )
    `;

    return NextResponse.json({
      message: 'Permission updated successfully',
      permission: updatedPermission[0]
    });
  } catch (error) {
    console.error('Error updating permission:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update permission' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/permissions/[id] - Archive permission (soft delete)
 */
async function deleteHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const hasPermission = await checkUserPermission(
      userId,
      PERMISSIONS.ADMIN.PERMISSIONS_MANAGE
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = PermissionIdSchema.parse({ id: params.id });
    const body = await request.json();
    const { reason } = PermissionArchiveSchema.parse(body);

    // Check if permission exists
    const existingPermission = await sql`
      SELECT * FROM permissions WHERE id = ${id}
    `;

    if (existingPermission.length === 0) {
      return NextResponse.json(
        { error: 'Permission not found' },
        { status: 404 }
      );
    }

    const permission = existingPermission[0];

    // Check if it's a system permission
    if (permission.is_system) {
      return NextResponse.json(
        { error: 'Cannot archive system permissions' },
        { status: 403 }
      );
    }

    // Archive the permission (this also disables it)
    const archivedPermission = await sql`
      UPDATE permissions 
      SET 
        is_active = FALSE,
        is_archived = TRUE,
        archived_at = CURRENT_TIMESTAMP,
        archived_by = ${userId},
        archive_reason = ${reason},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    // Remove from all role assignments
    await sql`
      UPDATE role_permissions 
      SET 
        is_active = FALSE,
        revoked_at = CURRENT_TIMESTAMP,
        revoked_by = ${userId},
        revoke_reason = 'Permission archived'
      WHERE permission_id = ${id} AND is_active = TRUE
    `;

    // Remove from all user assignments
    await sql`
      UPDATE user_permissions 
      SET 
        is_active = FALSE,
        revoked_at = CURRENT_TIMESTAMP,
        revoked_by = ${userId},
        revoke_reason = 'Permission archived'
      WHERE permission_id = ${id} AND is_active = TRUE
    `;

    // Log the action
    await sql`
      INSERT INTO permissions_audit (
        action_type, permission_id, admin_user_id, old_data, new_data, reason
      ) VALUES (
        'archive', ${id}, ${userId}, 
        ${JSON.stringify(permission)}, ${JSON.stringify(archivedPermission[0])}, 
        ${reason}
      )
    `;

    return NextResponse.json({
      message: 'Permission archived successfully',
      permission: archivedPermission[0]
    });
  } catch (error) {
    console.error('Error archiving permission:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to archive permission' },
      { status: 500 }
    );
  }
}

// ================================
// EXPORT HANDLERS
// ================================

export const GET = withUniversalEnhancements(getHandler);

export const PATCH = withUniversalEnhancements(patchHandler);

export const DELETE = withUniversalEnhancements(deleteHandler);
