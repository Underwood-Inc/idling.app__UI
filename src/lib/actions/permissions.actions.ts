'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '../auth';
import sql from '../db';
import { PERMISSIONS } from '../permissions/permissions';

/**
 * Server action to assign a role to a user
 * SECURITY: Admin and moderator roles can ONLY be assigned through direct database access
 */
export async function assignUserRole(
  userId: number,
  roleName: string,
  expiresAt?: Date
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('You must be logged in to assign roles');
  }

  const assignedBy = parseInt(session.user.id);

  // CRITICAL SECURITY: Prevent admin and moderator role assignment through API/UI
  const protectedRoles = ['admin', 'moderator'];
  if (protectedRoles.includes(roleName)) {
    console.error(
      `SECURITY VIOLATION: Attempt to assign protected role '${roleName}' to user ${userId} by user ${assignedBy}`
    );
    throw new Error(
      `${roleName} roles can only be assigned through direct database access`
    );
  }

  // Check if the person assigning has permission to manage roles
  const hasPermission = await checkUserPermission(
    assignedBy,
    PERMISSIONS.ADMIN.ROLES_MANAGE
  );
  if (!hasPermission) {
    console.error(
      `SECURITY VIOLATION: User ${assignedBy} attempted to assign role ${roleName} without permission`
    );
    throw new Error('Insufficient permissions to assign roles');
  }

  const roleResult = await sql<{ id: number; name: string }[]>`
    SELECT id, name FROM user_roles WHERE name = ${roleName}
  `;

  if (roleResult.length === 0) {
    throw new Error(`Role '${roleName}' not found`);
  }

  const roleId = roleResult[0].id;

  // Double-check: Ensure we're not somehow assigning protected roles
  if (protectedRoles.includes(roleResult[0].name)) {
    console.error(
      `SECURITY VIOLATION: Double-check failed - protected role '${roleResult[0].name}' assignment blocked`
    );
    throw new Error(
      `${roleResult[0].name} roles can only be assigned through direct database access`
    );
  }

  await sql`
    INSERT INTO user_role_assignments (user_id, role_id, assigned_by, expires_at)
    VALUES (${userId}, ${roleId}, ${assignedBy}, ${expiresAt ? expiresAt.toISOString() : null})
    ON CONFLICT (user_id, role_id) 
    DO UPDATE SET 
      assigned_by = ${assignedBy},
      assigned_at = CURRENT_TIMESTAMP,
      expires_at = ${expiresAt ? expiresAt.toISOString() : null},
      is_active = true
  `;

  console.error(
    `AUDIT: Role '${roleName}' assigned to user ${userId} by user ${assignedBy}`
  );

  revalidatePath('/admin');
  return true;
}

/**
 * Server action to remove a role from a user
 * SECURITY: Admin and moderator roles can ONLY be removed through direct database access
 */
export async function removeUserRole(userId: number, roleName: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('You must be logged in to remove roles');
  }

  const removedBy = parseInt(session.user.id);

  // CRITICAL SECURITY: Prevent admin and moderator role removal through API/UI
  const protectedRoles = ['admin', 'moderator'];
  if (protectedRoles.includes(roleName)) {
    console.error(
      `SECURITY VIOLATION: Attempt to remove protected role '${roleName}' from user ${userId} by user ${removedBy}`
    );
    throw new Error(
      `${roleName} roles can only be removed through direct database access`
    );
  }

  // Check if the person removing has permission to manage roles
  const hasPermission = await checkUserPermission(
    removedBy,
    PERMISSIONS.ADMIN.ROLES_MANAGE
  );
  if (!hasPermission) {
    console.error(
      `SECURITY VIOLATION: User ${removedBy} attempted to remove role ${roleName} without permission`
    );
    throw new Error('Insufficient permissions to remove roles');
  }

  await sql`
    UPDATE user_role_assignments 
    SET is_active = false
    WHERE user_id = ${userId}
    AND role_id = (SELECT id FROM user_roles WHERE name = ${roleName})
  `;

  console.error(
    `AUDIT: Role '${roleName}' removed from user ${userId} by user ${removedBy}`
  );

  revalidatePath('/admin');
  return true;
}

/**
 * Server action to check if a user has a specific permission
 */
export async function checkUserPermission(
  userId: number,
  permissionName: string
): Promise<boolean> {
  try {
    // Check direct user permissions first (these override role permissions)
    const directPermissionResult = await sql<{ granted: boolean }[]>`
      SELECT granted 
      FROM user_permissions up
      JOIN permissions p ON up.permission_id = p.id
      WHERE up.user_id = ${userId} 
      AND p.name = ${permissionName}
      AND (up.expires_at IS NULL OR up.expires_at > CURRENT_TIMESTAMP)
    `;

    // If found direct permission, return it
    if (directPermissionResult.length > 0) {
      return directPermissionResult[0].granted;
    }

    // Check role-based permissions
    const rolePermissionResult = await sql<{ id: number }[]>`
      SELECT p.id
      FROM user_role_assignments ura
      JOIN role_permissions rp ON ura.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE ura.user_id = ${userId}
      AND p.name = ${permissionName}
      AND ura.is_active = true
      AND (ura.expires_at IS NULL OR ura.expires_at > CURRENT_TIMESTAMP)
      LIMIT 1
    `;

    return rolePermissionResult.length > 0;
  } catch (error) {
    console.error('Error checking user permission:', error);
    return false;
  }
}

/**
 * Server action to get current user's permissions
 */
export async function getCurrentUserPermissions() {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  const userId = parseInt(session.user.id);

  const result = await sql<
    {
      name: string;
      display_name: string;
      category: string;
      granted?: boolean;
    }[]
  >`
    SELECT DISTINCT 
      p.name,
      p.display_name,
      p.category,
      COALESCE(up.granted, true) as granted
    FROM permissions p
    LEFT JOIN role_permissions rp ON p.id = rp.permission_id
    LEFT JOIN user_role_assignments ura ON rp.role_id = ura.role_id 
      AND ura.user_id = ${userId} 
      AND ura.is_active = true
      AND (ura.expires_at IS NULL OR ura.expires_at > CURRENT_TIMESTAMP)
    LEFT JOIN user_permissions up ON p.id = up.permission_id 
      AND up.user_id = ${userId}
      AND (up.expires_at IS NULL OR up.expires_at > CURRENT_TIMESTAMP)
    WHERE (ura.user_id IS NOT NULL OR up.user_id IS NOT NULL)
    AND COALESCE(up.granted, true) = true
    ORDER BY p.category, p.name
  `;

  return result;
}

/**
 * Server action to issue a timeout to a user
 */
export async function issueUserTimeout(
  userId: number,
  timeoutType: string,
  reason: string,
  durationHours: number
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('You must be logged in to issue timeouts');
  }

  const issuedBy = parseInt(session.user.id);

  // Check if the person issuing has permission to timeout users
  const hasPermission = await checkUserPermission(
    issuedBy,
    PERMISSIONS.ADMIN.USERS_TIMEOUT
  );
  if (!hasPermission) {
    console.error(
      `SECURITY VIOLATION: User ${issuedBy} attempted to issue timeout without permission`
    );
    throw new Error('Insufficient permissions to issue timeouts');
  }

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + durationHours);

  await sql`
    INSERT INTO user_timeouts (
      user_id, timeout_type, reason, issued_by, expires_at
    ) VALUES (
      ${userId}, ${timeoutType}, ${reason}, ${issuedBy}, ${expiresAt.toISOString()}
    )
  `;

  console.error(
    `AUDIT: Timeout issued to user ${userId} by user ${issuedBy} for ${durationHours} hours. Reason: ${reason}`
  );

  revalidatePath('/admin');
  return true;
}

/**
 * Server action to check if current user is timed out
 */
export async function checkCurrentUserTimeout(
  timeoutType: string = 'post_creation'
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { is_timed_out: false, expires_at: null, reason: null };
  }

  const userId = parseInt(session.user.id);

  const result = await sql<
    {
      expires_at: string;
      reason: string;
    }[]
  >`
    SELECT expires_at, reason
    FROM user_timeouts
    WHERE user_id = ${userId}
    AND timeout_type = ${timeoutType}
    AND is_active = true
    AND expires_at > CURRENT_TIMESTAMP
    ORDER BY expires_at DESC
    LIMIT 1
  `;

  if (result.length === 0) {
    return { is_timed_out: false, expires_at: null, reason: null };
  }

  return {
    is_timed_out: true,
    expires_at: new Date(result[0].expires_at),
    reason: result[0].reason
  };
}
