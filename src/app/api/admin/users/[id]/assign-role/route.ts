/**
 * Admin User Role Assignment API
 * Handles assigning and managing user roles
 */

import { checkUserPermission } from '@/lib/actions/permissions.actions';
import { auth } from '@/lib/auth';
import sql from '@/lib/db';
import { PERMISSIONS } from '@/lib/permissions/permissions';
import { NextRequest, NextResponse } from 'next/server';

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
    const targetUserId = parseInt(params.id);

    if (isNaN(targetUserId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Check if user has permission to assign roles
    const hasPermission = await checkUserPermission(
      adminUserId,
      PERMISSIONS.ADMIN.USERS_MANAGE
    );
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body: RoleAssignmentRequest = await request.json();
    const { roleId, expiresAt, reason } = body;

    if (!roleId) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 });
    }

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
    const targetUserId = parseInt(params.id);

    if (isNaN(targetUserId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Check if user has permission to manage roles
    const hasPermission = await checkUserPermission(
      adminUserId,
      PERMISSIONS.ADMIN.USERS_MANAGE
    );
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get('roleId');

    if (!roleId) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 });
    }

    // Deactivate the role assignment
    await sql`
      UPDATE user_role_assignments 
      SET is_active = false, updated_at = NOW()
      WHERE user_id = ${targetUserId} AND role_id = ${parseInt(roleId)} AND is_active = true
    `;

    return NextResponse.json({ 
      success: true, 
      message: 'Role removed successfully' 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to remove role' },
      { status: 500 }
    );
  }
} 