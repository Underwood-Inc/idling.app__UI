/**
 * Permissions System Utility
 * Handles role-based access control and permission checking
 */

import { unstable_noStore as noStore } from 'next/cache';
import { auth } from '../auth';
import sql from '../db';

export interface Permission {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  category: string;
  is_inheritable: boolean;
  is_system: boolean;
}

export interface UserRole {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  is_default: boolean;
  is_system: boolean;
}

export interface UserTimeout {
  id: number;
  user_id: number;
  timeout_type: string;
  reason: string;
  issued_by: number;
  issued_at: Date;
  expires_at: Date;
  is_active: boolean;
}

export interface TimeoutCheck {
  is_timed_out: boolean;
  expires_at?: Date;
  reason?: string;
}

// Database query result types
export interface PermissionQueryResult {
  has_permission: boolean;
}

export interface PermissionIdResult {
  id: number;
}

export interface RoleQueryResult {
  id: number;
  name: string;
}

export interface TimeoutQueryResult {
  is_timed_out: boolean;
  expires_at?: string;
  reason?: string;
}

export class PermissionsService {
  /**
   * Check if current user has a specific permission
   */
  static async hasPermission(permissionName: string): Promise<boolean> {
    // Prevent caching of auth checks
    noStore();

    // eslint-disable-next-line no-console
    console.log('🔍 hasPermission() called for:', permissionName);
    const session = await auth();
    // eslint-disable-next-line no-console
    console.log(
      '🔍 Session:',
      session?.user?.id ? `User ID: ${session.user.id}` : 'No session'
    );

    if (!session?.user?.id) {
      // eslint-disable-next-line no-console
      console.log('❌ No session or user ID, returning false');
      return false;
    }

    const result = await this.userHasPermission(
      parseInt(session.user.id),
      permissionName
    );
    // eslint-disable-next-line no-console
    console.log('🔍 userHasPermission result:', result);
    return result;
  }

  /**
   * Check if a specific user has a permission
   */
  static async userHasPermission(
    userId: number,
    permissionName: string
  ): Promise<boolean> {
    try {
      const result = await sql<PermissionQueryResult[]>`
        SELECT user_has_permission(${userId}, ${permissionName}) as has_permission
      `;

      return result[0]?.has_permission || false;
    } catch (error) {
      console.error('Error checking user permission:', error);
      return false;
    }
  }

  /**
   * Get all permissions for a user
   */
  static async getUserPermissions(userId: number): Promise<Permission[]> {
    try {
      const result = await sql<Permission[]>`
        SELECT DISTINCT p.id, p.name, p.display_name, p.description, p.category, p.is_inheritable, p.is_system
        FROM permissions p
        WHERE EXISTS (
          -- Check role-based permissions
          SELECT 1 FROM user_role_assignments ura
          JOIN role_permissions rp ON ura.role_id = rp.role_id
          WHERE ura.user_id = ${userId}
          AND rp.permission_id = p.id
          AND ura.is_active = true
          AND (ura.expires_at IS NULL OR ura.expires_at > CURRENT_TIMESTAMP)
        ) OR EXISTS (
          -- Check direct user permissions (granted)
          SELECT 1 FROM user_permissions up
          WHERE up.user_id = ${userId}
          AND up.permission_id = p.id
          AND up.granted = true
          AND (up.expires_at IS NULL OR up.expires_at > CURRENT_TIMESTAMP)
        )
        AND NOT EXISTS (
          -- Exclude explicitly denied permissions
          SELECT 1 FROM user_permissions up
          WHERE up.user_id = ${userId}
          AND up.permission_id = p.id
          AND up.granted = false
          AND (up.expires_at IS NULL OR up.expires_at > CURRENT_TIMESTAMP)
        )
        ORDER BY p.category, p.name
      `;

      return result;
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return [];
    }
  }

  /**
   * Get user's roles
   */
  static async getUserRoles(userId: number): Promise<UserRole[]> {
    try {
      const result = await sql<UserRole[]>`
        SELECT ur.id, ur.name, ur.display_name, ur.description, ur.is_default, ur.is_system
        FROM user_roles ur
        JOIN user_role_assignments ura ON ur.id = ura.role_id
        WHERE ura.user_id = ${userId}
        AND ura.is_active = true
        AND (ura.expires_at IS NULL OR ura.expires_at > CURRENT_TIMESTAMP)
        ORDER BY ur.name
      `;

      return result;
    } catch (error) {
      console.error('Error getting user roles:', error);
      return [];
    }
  }

  /**
   * Check if user is timed out for a specific action
   */
  static async checkUserTimeout(
    userId: number,
    timeoutType: string = 'post_creation'
  ): Promise<TimeoutCheck> {
    try {
      const result = await sql<TimeoutQueryResult[]>`
        SELECT * FROM user_is_timed_out(${userId}, ${timeoutType})
      `;

      const row = result[0];
      if (!row) {
        return { is_timed_out: false };
      }

      return {
        is_timed_out: row.is_timed_out,
        expires_at: row.expires_at ? new Date(row.expires_at) : undefined,
        reason: row.reason
      };
    } catch (error) {
      console.error('Error checking user timeout:', error);
      return { is_timed_out: false };
    }
  }

  /**
   * Issue a timeout to a user
   */
  static async issueTimeout(
    userId: number,
    timeoutType: string,
    reason: string,
    durationHours: number,
    issuedBy: number
  ): Promise<boolean> {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + durationHours);

      await sql`
        INSERT INTO user_timeouts (user_id, timeout_type, reason, issued_by, expires_at)
        VALUES (${userId}, ${timeoutType}, ${reason}, ${issuedBy}, ${expiresAt.toISOString()})
      `;

      return true;
    } catch (error) {
      console.error('Error issuing timeout:', error);
      return false;
    }
  }

  /**
   * Revoke a timeout early
   */
  static async revokeTimeout(
    timeoutId: number,
    revokedBy: number,
    revokeReason: string
  ): Promise<boolean> {
    try {
      await sql`
        UPDATE user_timeouts
        SET is_active = false, revoked_by = ${revokedBy}, revoked_at = CURRENT_TIMESTAMP, revoke_reason = ${revokeReason}
        WHERE id = ${timeoutId} AND is_active = true
      `;

      return true;
    } catch (error) {
      console.error('Error revoking timeout:', error);
      return false;
    }
  }

  /**
   * Grant permission to user
   */
  static async grantPermission(
    userId: number,
    permissionName: string,
    grantedBy: number,
    reason?: string,
    expiresAt?: Date
  ): Promise<boolean> {
    try {
      const permissionResult = await sql<PermissionIdResult[]>`
        SELECT id FROM permissions WHERE name = ${permissionName}
      `;

      if (permissionResult.length === 0) {
        throw new Error(`Permission '${permissionName}' not found`);
      }

      const permissionId = permissionResult[0].id;

      await sql`
        INSERT INTO user_permissions (user_id, permission_id, granted, granted_by, reason, expires_at)
        VALUES (${userId}, ${permissionId}, true, ${grantedBy}, ${reason || null}, ${expiresAt ? expiresAt.toISOString() : null})
        ON CONFLICT (user_id, permission_id) 
        DO UPDATE SET 
          granted = true,
          granted_by = ${grantedBy},
          granted_at = CURRENT_TIMESTAMP,
          reason = ${reason || null},
          expires_at = ${expiresAt ? expiresAt.toISOString() : null}
      `;

      return true;
    } catch (error) {
      console.error('Error granting permission:', error);
      return false;
    }
  }

  /**
   * Revoke permission from user
   */
  static async revokePermission(
    userId: number,
    permissionName: string,
    revokedBy: number,
    reason?: string
  ): Promise<boolean> {
    try {
      const permissionResult = await sql<PermissionIdResult[]>`
        SELECT id FROM permissions WHERE name = ${permissionName}
      `;

      if (permissionResult.length === 0) {
        throw new Error(`Permission '${permissionName}' not found`);
      }

      const permissionId = permissionResult[0].id;

      await sql`
        INSERT INTO user_permissions (user_id, permission_id, granted, granted_by, reason)
        VALUES (${userId}, ${permissionId}, false, ${revokedBy}, ${reason || null})
        ON CONFLICT (user_id, permission_id) 
        DO UPDATE SET 
          granted = false,
          granted_by = ${revokedBy},
          granted_at = CURRENT_TIMESTAMP,
          reason = ${reason || null},
          expires_at = NULL
      `;

      return true;
    } catch (error) {
      console.error('Error revoking permission:', error);
      return false;
    }
  }

  /**
   * Assign role to user
   * SECURITY: Admin roles can ONLY be assigned through direct database access
   */
  static async assignRole(
    userId: number,
    roleName: string,
    assignedBy: number,
    expiresAt?: Date
  ): Promise<boolean> {
    try {
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
      const hasPermission = await this.userHasPermission(
        assignedBy,
        PERMISSIONS.ADMIN.ROLES_MANAGE
      );
      if (!hasPermission) {
        console.error(
          `SECURITY VIOLATION: User ${assignedBy} attempted to assign role ${roleName} without permission`
        );
        throw new Error('Insufficient permissions to assign roles');
      }

      const roleResult = await sql<RoleQueryResult[]>`
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

      // Log successful role assignment (using console.error for visibility in production logs)
      console.error(
        `AUDIT: Role '${roleName}' assigned to user ${userId} by user ${assignedBy}`
      );
      return true;
    } catch (error) {
      console.error('Error assigning role:', error);
      return false;
    }
  }

  /**
   * Remove role from user
   * SECURITY: Admin roles can ONLY be removed through direct database access
   */
  static async removeRole(
    userId: number,
    roleName: string,
    removedBy: number
  ): Promise<boolean> {
    try {
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
      const hasPermission = await this.userHasPermission(
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
      return true;
    } catch (error) {
      console.error('Error removing role:', error);
      return false;
    }
  }

  /**
   * Get all available permissions
   */
  static async getAllPermissions(): Promise<Permission[]> {
    try {
      const result = await sql<Permission[]>`
        SELECT id, name, display_name, description, category, is_inheritable, is_system
        FROM permissions
        ORDER BY category, name
      `;

      return result;
    } catch (error) {
      console.error('Error getting all permissions:', error);
      return [];
    }
  }

  /**
   * Get all available roles
   */
  static async getAllRoles(): Promise<UserRole[]> {
    try {
      const result = await sql<UserRole[]>`
        SELECT id, name, display_name, description, is_default, is_system
        FROM user_roles
        ORDER BY name
      `;

      return result;
    } catch (error) {
      console.error('Error getting all roles:', error);
      return [];
    }
  }

  /**
   * Get permissions by category
   */
  static async getPermissionsByCategory(
    category: string
  ): Promise<Permission[]> {
    try {
      const result = await sql<Permission[]>`
        SELECT id, name, display_name, description, category, is_inheritable, is_system
        FROM permissions
        WHERE category = ${category}
        ORDER BY name
      `;

      return result;
    } catch (error) {
      console.error('Error getting permissions by category:', error);
      return [];
    }
  }
}

/**
 * Permission middleware for API routes
 */
export async function requirePermission(
  permissionName: string
): Promise<boolean> {
  return await PermissionsService.hasPermission(permissionName);
}

/**
 * Multiple permissions check (user must have ALL permissions)
 */
export async function requireAllPermissions(
  permissionNames: string[]
): Promise<boolean> {
  for (const permission of permissionNames) {
    if (!(await PermissionsService.hasPermission(permission))) {
      return false;
    }
  }
  return true;
}

/**
 * Multiple permissions check (user must have ANY permission)
 */
export async function requireAnyPermission(
  permissionNames: string[]
): Promise<boolean> {
  for (const permission of permissionNames) {
    if (await PermissionsService.hasPermission(permission)) {
      return true;
    }
  }
  return false;
}

/**
 * Admin access check
 */
export async function requireAdmin(): Promise<boolean> {
  // Prevent caching of admin checks
  noStore();

  // eslint-disable-next-line no-console
  console.log('🔍 requireAdmin() called');
  const result = await PermissionsService.hasPermission('admin.access');
  // eslint-disable-next-line no-console
  console.log('🔍 requireAdmin() result:', result);
  return result;
}

/**
 * Check if user can moderate content
 */
export async function canModerate(): Promise<boolean> {
  return await requireAnyPermission(['admin.posts.moderate', 'admin.access']);
}

/**
 * Common permission constants
 */
export const PERMISSIONS = {
  ADMIN: {
    ACCESS: 'admin.access',
    EMOJI_APPROVE: 'admin.emoji.approve',
    EMOJI_MANAGE: 'admin.emoji.manage',
    USERS_VIEW: 'admin.users.view',
    USERS_TIMEOUT: 'admin.users.timeout',
    USERS_MANAGE: 'admin.users.manage',
    PERMISSIONS_VIEW: 'admin.permissions.view',
    PERMISSIONS_MANAGE: 'admin.permissions.manage',
    ROLES_VIEW: 'admin.roles.view',
    ROLES_MANAGE: 'admin.roles.manage',
    POSTS_MODERATE: 'admin.posts.moderate'
  },
  CONTENT: {
    CREATE_POST: 'content.create.post',
    EDIT_OWN: 'content.edit.own',
    DELETE_OWN: 'content.delete.own',
    COMMENT: 'content.comment'
  },
  EMOJI: {
    USE_STANDARD: 'emoji.use.standard',
    USE_CUSTOM: 'emoji.use.custom',
    CREATE_CUSTOM: 'emoji.create.custom',
    USE_OWN: 'emoji.use.own'
  }
} as const;

/**
 * Timeout types
 */
export const TIMEOUT_TYPES = {
  POST_CREATION: 'post_creation',
  COMMENT_CREATION: 'comment_creation',
  FULL_ACCESS: 'full_access'
} as const;
