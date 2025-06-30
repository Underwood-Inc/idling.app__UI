/**
 * Admin User Role Assignment API
 * Handles assigning and managing user roles
 */

import { checkUserPermission } from '@/lib/actions/permissions.actions';
import { auth } from '@/lib/auth';
import sql from '@/lib/db';
import { PERMISSIONS } from '@/lib/permissions/permissions';
import {
  AdminUserRoleAssignmentSchema,
  AdminUserRoleRemovalParamsSchema,
  UserIdParamsSchema
} from '@/lib/schemas/admin-users.schema';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export interface RoleAssignmentRequest {
  roleId: number;
  expiresAt?: string;
  reason?: string;
}

// POST /api/admin/users/[id]/assign-role - Assign role to user
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminUserId = parseInt(session.user.id);

    // Validate params
    const postUserIdValidation = UserIdParamsSchema.safeParse(params);
    if (!postUserIdValidation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid user ID format',
          details: postUserIdValidation.error.errors 
        },
        { status: 400 }
      );
    }

    const targetUserId = parseInt(postUserIdValidation.data.id);

    // Check if user has permission to assign roles
    const hasPermission = await checkUserPermission(
      adminUserId,
      PERMISSIONS.ADMIN.USERS_MANAGE
    );
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Validate request body
    const body = await request.json();
    const bodyResult = AdminUserRoleAssignmentSchema.safeParse(body);
    
    if (!bodyResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: bodyResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { roleId, expiresAt, reason } = bodyResult.data;

    // Verify the role exists
    const roles = await sql<{ id: number; name: string }[]>`
      SELECT id, name FROM user_roles WHERE id = ${roleId}
    `;

    if (roles.length === 0) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Check if user already has this role
    const existingAssignments = await sql<{ id: number }[]>`
      SELECT id FROM user_role_assignments 
      WHERE user_id = ${targetUserId} AND role_id = ${roleId} AND is_active = true
    `;

    if (existingAssignments.length > 0) {
      return NextResponse.json({ error: 'User already has this role' }, { status: 409 });
    }

    // Assign the role
    await sql`
      INSERT INTO user_role_assignments (
        user_id, role_id, assigned_by, assigned_at, expires_at, is_active, reason
      ) VALUES (
        ${targetUserId}, 
        ${roleId}, 
        ${adminUserId}, 
        NOW(), 
        ${expiresAt || null}, 
        true, 
        ${reason || null}
      )
    `;

    return NextResponse.json({ 
      success: true, 
      message: `Role assigned successfully` 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to assign role' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id]/assign-role - Remove role from user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminUserId = parseInt(session.user.id);

    // Validate params
    const deleteUserIdValidation = UserIdParamsSchema.safeParse(params);
    if (!deleteUserIdValidation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid user ID format',
          details: deleteUserIdValidation.error.errors 
        },
        { status: 400 }
      );
    }

    const targetUserId = parseInt(deleteUserIdValidation.data.id);

    // Check if user has permission to manage roles
    const hasPermission = await checkUserPermission(
      adminUserId,
      PERMISSIONS.ADMIN.USERS_MANAGE
    );
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Validate query parameters
    const { searchParams } = new URL(request.url);
    const queryValidation = AdminUserRoleRemovalParamsSchema.safeParse({
      roleId: searchParams.get('roleId'),
    });

    if (!queryValidation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid role removal parameters',
          details: queryValidation.error.errors 
        },
        { status: 400 }
      );
    }

    const { roleId } = queryValidation.data;

    // Deactivate the role assignment
    await sql`
      UPDATE user_role_assignments 
      SET is_active = false, updated_at = NOW()
      WHERE user_id = ${targetUserId} AND role_id = ${roleId} AND is_active = true
    `;

    return NextResponse.json({ 
      success: true, 
      message: 'Role removed successfully' 
    });
  } catch (error) {
    console.error('Error removing role:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to remove role' },
      { status: 500 }
    );
  }
} 