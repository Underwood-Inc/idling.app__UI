/**
 * Admin Roles Management API
 * Handles comprehensive roles management with full CRUD operations
 * 
 * @author System Wizard 🧙‍♂️
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkUserPermission } from '../../../../../lib/actions/permissions.actions';
import { auth } from '../../../../../lib/auth';
import sql from '../../../../../lib/db';
import { withRateLimit } from '../../../../../lib/middleware/withRateLimit';
import { PERMISSIONS } from '../../../../../lib/permissions/permissions';

export const runtime = 'nodejs';

// ================================
// SCHEMAS
// ================================

const RoleSearchSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['all', 'active', 'disabled', 'archived']).optional().default('all'),
  sort_by: z.enum(['name', 'display_name', 'created_at', 'updated_at', 'user_count', 'permission_count', 'sort_order']).optional().default('sort_order'),
  sort_order: z.enum(['asc', 'desc']).optional().default('asc'),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

const RoleCreateSchema = z.object({
  name: z.string().min(1).max(100).regex(/^[a-z0-9_-]+$/i, 'Invalid role name format'),
  display_name: z.string().min(1).max(200),
  description: z.string().optional(),
  role_color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color').optional().default('#6366F1'),
  role_icon: z.string().min(1).max(50).optional().default('user'),
  is_default: z.boolean().optional().default(false),
  permissions: z.array(z.number()).optional().default([]),
  metadata: z.record(z.any()).optional().default({}),
  reason: z.string().optional(),
});

const RoleUpdateSchema = z.object({
  display_name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  role_color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color').optional(),
  role_icon: z.string().min(1).max(50).optional(),
  is_active: z.boolean().optional(),
  is_default: z.boolean().optional(),
  sort_order: z.number().min(0).optional(),
  permissions: z.array(z.number()).optional(),
  metadata: z.record(z.any()).optional(),
  reason: z.string().optional(),
});

const RoleArchiveSchema = z.object({
  reason: z.string().min(1).max(500),
});

const RolePermissionUpdateSchema = z.object({
  permission_ids: z.array(z.number()),
  reason: z.string().optional(),
});

// ================================
// HANDLERS
// ================================

/**
 * GET /api/admin/permissions/roles - Get roles with search, filtering, and pagination
 */
async function getHandler(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const hasPermission = await checkUserPermission(userId, PERMISSIONS.ADMIN.ROLES_VIEW);
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const params = RoleSearchSchema.parse(Object.fromEntries(searchParams));

    // Build base query
    let baseQuery = sql`
      SELECT 
        ur.*,
        COALESCE(user_stats.user_count, 0) as user_count,
        COALESCE(permission_stats.permission_count, 0) as permission_count,
        archived_by_user.name as archived_by_name,
        archived_by_user.email as archived_by_email
      FROM user_roles ur
      LEFT JOIN (
        SELECT role_id, COUNT(*) as user_count
        FROM user_role_assignments
        WHERE is_active = TRUE
        GROUP BY role_id
      ) user_stats ON ur.id = user_stats.role_id
      LEFT JOIN (
        SELECT role_id, COUNT(*) as permission_count
        FROM role_permissions
        WHERE is_active = TRUE
        GROUP BY role_id
      ) permission_stats ON ur.id = permission_stats.role_id
      LEFT JOIN users archived_by_user ON ur.archived_by = archived_by_user.id
    `;

    // Add search filtering
    if (params.search) {
      baseQuery = sql`
        ${baseQuery}
        WHERE (ur.name ILIKE ${'%' + params.search + '%'} 
               OR ur.display_name ILIKE ${'%' + params.search + '%'} 
               OR ur.description ILIKE ${'%' + params.search + '%'})
      `;
    }

    // Add status filtering
    if (params.status !== 'all') {
      const statusCondition = params.status === 'active' ? 
        sql`ur.is_active = TRUE AND ur.is_archived = FALSE` :
        params.status === 'disabled' ?
        sql`ur.is_active = FALSE AND ur.is_archived = FALSE` :
        sql`ur.is_archived = TRUE`;
      
      baseQuery = params.search ? 
        sql`${baseQuery} AND ${statusCondition}` :
        sql`${baseQuery} WHERE ${statusCondition}`;
    }

    // Add sorting
    let sortField;
    if (params.sort_by === 'user_count') {
      sortField = 'user_count';
    } else if (params.sort_by === 'permission_count') {
      sortField = 'permission_count';
    } else if (params.sort_by === 'sort_order') {
      sortField = 'ur.sort_order';
    } else if (params.sort_by === 'display_name') {
      sortField = 'ur.display_name';
    } else if (params.sort_by === 'created_at') {
      sortField = 'ur.created_at';
    } else {
      sortField = `ur.${params.sort_by}`;
    }
    const sortOrder = params.sort_order.toUpperCase();
    
    // Calculate offset
    const offset = (params.page - 1) * params.limit;

    // Execute query with pagination
    const roles = await sql`
      ${baseQuery}
      ORDER BY ${sql.unsafe(sortField)} ${sql.unsafe(sortOrder)}
      LIMIT ${params.limit} OFFSET ${offset}
    `;

    // Get total count with same filtering as main query
    let countQuery = sql`SELECT COUNT(*) as total FROM user_roles ur`;
    
    // Apply same search filtering to count
    if (params.search) {
      countQuery = sql`
        SELECT COUNT(*) as total FROM user_roles ur
        WHERE (ur.name ILIKE ${'%' + params.search + '%'} 
               OR ur.display_name ILIKE ${'%' + params.search + '%'} 
               OR ur.description ILIKE ${'%' + params.search + '%'})
      `;
    }

    // Apply same status filtering to count
    if (params.status !== 'all') {
      const statusCondition = params.status === 'active' ? 
        sql`ur.is_active = TRUE AND ur.is_archived = FALSE` :
        params.status === 'disabled' ?
        sql`ur.is_active = FALSE AND ur.is_archived = FALSE` :
        sql`ur.is_archived = TRUE`;
      
      countQuery = params.search ? 
        sql`${countQuery} AND ${statusCondition}` :
        sql`${countQuery} WHERE ${statusCondition}`;
    }

    const countResult = await countQuery;
    const totalCount = parseInt(countResult[0].total);

    // Get permissions for each role
    const rolesWithPermissions = await Promise.all(
      roles.map(async (role) => {
        const permissions = await sql`
          SELECT 
            p.id, p.name, p.display_name, p.category, p.risk_level,
            rp.granted_at, granted_by_user.name as granted_by_name
          FROM role_permissions rp
          JOIN permissions p ON rp.permission_id = p.id
          LEFT JOIN users granted_by_user ON rp.granted_by = granted_by_user.id
          WHERE rp.role_id = ${role.id} AND rp.is_active = TRUE
          ORDER BY p.category, p.display_name
        `;

        return {
          ...role,
          permissions: permissions
        };
      })
    );

    return NextResponse.json({
      roles: rolesWithPermissions,
      pagination: {
        page: params.page,
        limit: params.limit,
        total: totalCount,
        pages: Math.ceil(totalCount / params.limit),
        has_more: offset + roles.length < totalCount
      }
    });

  } catch (error) {
    console.error('Error fetching roles:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/permissions/roles - Create new role
 */
async function postHandler(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const hasPermission = await checkUserPermission(userId, PERMISSIONS.ADMIN.ROLES_MANAGE);
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const data = RoleCreateSchema.parse(body);

    // Check if role name already exists
    const existingRole = await sql`
      SELECT id FROM user_roles WHERE name = ${data.name}
    `;

    if (existingRole.length > 0) {
      return NextResponse.json(
        { error: 'Role name already exists' },
        { status: 409 }
      );
    }

    // If setting as default, unset other defaults
    if (data.is_default) {
      await sql`
        UPDATE user_roles SET is_default = FALSE WHERE is_default = TRUE
      `;
    }

    // Create role
    const newRole = await sql`
      INSERT INTO user_roles (
        name, display_name, description, role_color, role_icon, 
        is_default, metadata, is_system, created_at, updated_at
      ) VALUES (
        ${data.name}, ${data.display_name}, ${data.description || null},
        ${data.role_color}, ${data.role_icon}, ${data.is_default},
        ${JSON.stringify(data.metadata)}, false,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *
    `;

    const roleId = newRole[0].id;

    // Assign permissions to role
    if (data.permissions.length > 0) {
      const permissionInserts = data.permissions.map(permissionId => 
        sql`
          INSERT INTO role_permissions (role_id, permission_id, granted_by, granted_at)
          VALUES (${roleId}, ${permissionId}, ${userId}, CURRENT_TIMESTAMP)
        `
      );
      
      await Promise.all(permissionInserts);
    }

    // Log the action
    await sql`
      INSERT INTO roles_audit (
        action_type, role_id, admin_user_id, new_data, reason
      ) VALUES (
        'create', ${roleId}, ${userId}, ${JSON.stringify(newRole[0])}, ${data.reason || 'New role created'}
      )
    `;

    return NextResponse.json({
      message: 'Role created successfully',
      role: newRole[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating role:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 }
    );
  }
}

// ================================
// EXPORT HANDLERS
// ================================

export const GET = withRateLimit(getHandler);

export const POST = withRateLimit(postHandler); 