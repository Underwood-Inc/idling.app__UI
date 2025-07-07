/**
 * Admin Permissions Management API
 * Handles comprehensive permissions management with full CRUD operations
 * 
 * @author System Wizard 🧙‍♂️
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkUserPermission } from '../../../../lib/actions/permissions.actions';
import { auth } from '../../../../lib/auth';
import sql from '../../../../lib/db';
import { withRateLimit } from '../../../../lib/middleware/withRateLimit';
import { PERMISSIONS } from '../../../../lib/permissions/permissions';

export const runtime = 'nodejs';

// ================================
// TYPES & SCHEMAS
// ================================

export interface PermissionOverview {
  total_permissions: number;
  active_permissions: number;
  disabled_permissions: number;
  archived_permissions: number;
  total_roles: number;
  active_roles: number;
  disabled_roles: number;
  archived_roles: number;
  total_user_assignments: number;
  active_user_assignments: number;
  recent_changes: number;
}

export interface PermissionWithStats {
  id: number;
  name: string;
  display_name: string;
  description: string;
  category: string;
  is_inheritable: boolean;
  is_active: boolean;
  is_archived: boolean;
  is_system: boolean;
  risk_level: string;
  sort_order: number;
  dependencies: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  archived_by: number | null;
  archive_reason: string | null;
  usage_count: number;
  role_count: number;
  user_count: number;
  last_used: string | null;
}

export interface RoleWithStats {
  id: number;
  name: string;
  display_name: string;
  description: string;
  is_active: boolean;
  is_archived: boolean;
  is_system: boolean;
  is_default: boolean;
  sort_order: number;
  role_color: string;
  role_icon: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  archived_by: number | null;
  archive_reason: string | null;
  permission_count: number;
  user_count: number;
  permissions: Array<{
    id: number;
    name: string;
    display_name: string;
    category: string;
    risk_level: string;
  }>;
}

const PermissionSearchSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['all', 'active', 'disabled', 'archived']).optional().default('all'),
  risk_level: z.enum(['all', 'low', 'medium', 'high', 'critical']).optional().default('all'),
  sort_by: z.enum(['name', 'display_name', 'category', 'created_at', 'updated_at', 'usage_count', 'sort_order']).optional().default('sort_order'),
  sort_order: z.enum(['asc', 'desc']).optional().default('asc'),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

const PermissionCreateSchema = z.object({
  name: z.string().min(1).max(100).regex(/^[a-z0-9._-]+$/i, 'Invalid permission name format'),
  display_name: z.string().min(1).max(200),
  description: z.string().optional(),
  category: z.string().min(1).max(50),
  is_inheritable: z.boolean().optional().default(false),
  risk_level: z.enum(['low', 'medium', 'high', 'critical']).optional().default('low'),
  dependencies: z.array(z.string()).optional().default([]),
  metadata: z.record(z.any()).optional().default({}),
  reason: z.string().optional(),
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
  reason: z.string().optional(),
});

const PermissionArchiveSchema = z.object({
  reason: z.string().min(1).max(500),
});

// ================================
// HANDLERS
// ================================

/**
 * GET /api/admin/permissions - Get permissions with search, filtering, and pagination
 */
async function getHandler(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const hasPermission = await checkUserPermission(userId, PERMISSIONS.ADMIN.PERMISSIONS_VIEW);
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const params = PermissionSearchSchema.parse(Object.fromEntries(searchParams));

    // Build dynamic query conditions
    let baseQuery = sql`
      SELECT 
        p.*,
        COALESCE(rp_count.role_count, 0) as role_count,
        COALESCE(up_count.user_count, 0) as user_count,
        COALESCE(rp_count.role_count, 0) + COALESCE(up_count.user_count, 0) as usage_count,
        recent_usage.last_used
      FROM permissions p
      LEFT JOIN (
        SELECT permission_id, COUNT(*) as role_count
        FROM role_permissions
        WHERE is_active = TRUE
        GROUP BY permission_id
      ) rp_count ON p.id = rp_count.permission_id
      LEFT JOIN (
        SELECT permission_id, COUNT(*) as user_count
        FROM user_permissions
        WHERE is_active = TRUE AND granted = TRUE
        GROUP BY permission_id
      ) up_count ON p.id = up_count.permission_id
      LEFT JOIN (
        SELECT permission_id, MAX(granted_at) as last_used
        FROM user_permissions
        WHERE is_active = TRUE
        GROUP BY permission_id
      ) recent_usage ON p.id = recent_usage.permission_id
    `;

    // Add search filtering
    if (params.search) {
      baseQuery = sql`
        ${baseQuery}
        WHERE (p.name ILIKE ${'%' + params.search + '%'} 
               OR p.display_name ILIKE ${'%' + params.search + '%'} 
               OR p.description ILIKE ${'%' + params.search + '%'})
      `;
    }

    // Add category filtering
    if (params.category) {
      baseQuery = params.search ? 
        sql`${baseQuery} AND p.category = ${params.category}` :
        sql`${baseQuery} WHERE p.category = ${params.category}`;
    }

    // Add status filtering
    if (params.status !== 'all') {
      const statusCondition = params.status === 'active' ? 
        sql`p.is_active = TRUE AND p.is_archived = FALSE` :
        params.status === 'disabled' ?
        sql`p.is_active = FALSE AND p.is_archived = FALSE` :
        sql`p.is_archived = TRUE`;
      
      baseQuery = (params.search || params.category) ? 
        sql`${baseQuery} AND ${statusCondition}` :
        sql`${baseQuery} WHERE ${statusCondition}`;
    }

    // Add risk level filtering
    if (params.risk_level !== 'all') {
      const hasWhere = params.search || params.category || params.status !== 'all';
      baseQuery = hasWhere ? 
        sql`${baseQuery} AND p.risk_level = ${params.risk_level}` :
        sql`${baseQuery} WHERE p.risk_level = ${params.risk_level}`;
    }

    // Add sorting
    const sortField = params.sort_by === 'usage_count' ? 'usage_count' : `p.${params.sort_by}`;
    const sortOrder = params.sort_order.toUpperCase();
    
    // Calculate offset
    const offset = (params.page - 1) * params.limit;

    // Execute query with pagination
    const permissions = await sql`
      ${baseQuery}
      ORDER BY ${sql.unsafe(sortField)} ${sql.unsafe(sortOrder)}
      LIMIT ${params.limit} OFFSET ${offset}
    `;

    // Get total count (simplified for now)
    const countResult = await sql`
      SELECT COUNT(*) as total FROM permissions p
    `;
    const totalCount = parseInt(countResult[0].total);

    // Get overview stats
    const overview = await sql`
      SELECT 
        (SELECT COUNT(*) FROM permissions) as total_permissions,
        (SELECT COUNT(*) FROM permissions WHERE is_active = TRUE AND is_archived = FALSE) as active_permissions,
        (SELECT COUNT(*) FROM permissions WHERE is_active = FALSE AND is_archived = FALSE) as disabled_permissions,
        (SELECT COUNT(*) FROM permissions WHERE is_archived = TRUE) as archived_permissions,
        (SELECT COUNT(*) FROM user_roles) as total_roles,
        (SELECT COUNT(*) FROM user_roles WHERE is_active = TRUE AND is_archived = FALSE) as active_roles,
        (SELECT COUNT(*) FROM user_roles WHERE is_active = FALSE AND is_archived = FALSE) as disabled_roles,
        (SELECT COUNT(*) FROM user_roles WHERE is_archived = TRUE) as archived_roles,
        (SELECT COUNT(*) FROM user_role_assignments) as total_user_assignments,
        (SELECT COUNT(*) FROM user_role_assignments WHERE is_active = TRUE) as active_user_assignments,
        0 as recent_changes
    `;

    return NextResponse.json({
      permissions: permissions as unknown as PermissionWithStats[],
      overview: overview[0] as PermissionOverview,
      pagination: {
        page: params.page,
        limit: params.limit,
        total: totalCount,
        pages: Math.ceil(totalCount / params.limit),
        has_more: offset + permissions.length < totalCount
      }
    });

  } catch (error) {
    console.error('Error fetching permissions:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/permissions - Create new permission
 */
async function postHandler(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const hasPermission = await checkUserPermission(userId, PERMISSIONS.ADMIN.PERMISSIONS_MANAGE);
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const data = PermissionCreateSchema.parse(body);

    // Check if permission name already exists
    const existingPermission = await sql`
      SELECT id FROM permissions WHERE name = ${data.name}
    `;

    if (existingPermission.length > 0) {
      return NextResponse.json(
        { error: 'Permission name already exists' },
        { status: 409 }
      );
    }

    // Create permission
    const newPermission = await sql`
      INSERT INTO permissions (
        name, display_name, description, category, is_inheritable,
        risk_level, dependencies, metadata, is_system, created_at, updated_at
      ) VALUES (
        ${data.name}, ${data.display_name}, ${data.description || null},
        ${data.category}, ${data.is_inheritable}, ${data.risk_level},
        ${data.dependencies}, ${JSON.stringify(data.metadata)}, false,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *
    `;

    // Log the action
    await sql`
      INSERT INTO permissions_audit (
        action_type, permission_id, admin_user_id, new_data, reason
      ) VALUES (
        'create', ${newPermission[0].id}, ${userId}, ${JSON.stringify(newPermission[0])}, ${data.reason || 'New permission created'}
      )
    `;

    return NextResponse.json({
      message: 'Permission created successfully',
      permission: newPermission[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating permission:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create permission' },
      { status: 500 }
    );
  }
}

// ================================
// EXPORT HANDLERS
// ================================

export const GET = withRateLimit(getHandler);

export const POST = withRateLimit(postHandler); 