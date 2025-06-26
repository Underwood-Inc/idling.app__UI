/**
 * Permissions System Utility
 * Handles role-based access control and permission checking
 */

import { createLogger } from '@/lib/logging';
import { unstable_noStore as noStore } from 'next/cache';
import { auth } from '../auth';
import sql from '../db';

// Create component-specific logger
const logger = createLogger({
  context: {
    component: 'PermissionsService',
    module: 'permissions'
  },
  enabled: false
});

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

    const session = await auth();

    if (!session?.user?.id) {
      return false;
    }

    const result = await this.userHasPermission(
      parseInt(session.user.id),
      permissionName
    );
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
      logger.group('userHasPermission');
      // If database function doesn't exist, fallback to basic check
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === '42883'
      ) {
        logger.warn('Permission function not found, using fallback logic', {
          permissionName,
          userId,
          errorCode: error.code
        });
        const result = this.fallbackPermissionCheck(userId, permissionName);
        logger.groupEnd();
        return result;
      }
      logger.error('Error checking user permission', error as Error, {
        userId,
        permissionName
      });
      logger.groupEnd();
      return false;
    }
  }

  /**
   * Fallback permission check when database functions are not available
   */
  private static async fallbackPermissionCheck(
    userId: number,
    permissionName: string
  ): Promise<boolean> {
    try {
      // Basic content permissions for logged-in users
      const basicPermissions = [
        'content.create.post',
        'content.edit.own',
        'content.delete.own',
        'content.comment',
        'emoji.use.standard',
        'emoji.use.custom',
        'emoji.create.custom',
        'emoji.use.own'
      ];

      if (basicPermissions.includes(permissionName)) {
        return true;
      }

      // Admin permissions - only for user ID 1 (first user)
      const adminPermissions = [
        'admin.access',
        'admin.emoji.approve',
        'admin.users.view',
        'admin.users.timeout',
        'admin.posts.moderate'
      ];

      if (adminPermissions.includes(permissionName) && userId === 1) {
        return true;
      }

      return false;
    } catch (error) {
      logger.group('fallbackPermissionCheck');
      logger.error('Error in fallback permission check', error as Error, {
        userId,
        permissionName
      });
      logger.groupEnd();
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
      logger.group('getUserPermissions');
      logger.error('Error getting user permissions', error as Error, {
        userId
      });
      logger.groupEnd();
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
      logger.group('getUserRoles');
      logger.error('Error getting user roles', error as Error, { userId });
      logger.groupEnd();
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
      logger.group('checkUserTimeout');
      // If database function doesn't exist, fallback to no timeout
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === '42883'
      ) {
        logger.warn('Timeout function not found, assuming no timeout', {
          userId,
          timeoutType,
          errorCode: error.code
        });
        logger.groupEnd();
        return { is_timed_out: false };
      }
      logger.error('Error checking user timeout', error as Error, {
        userId,
        timeoutType
      });
      logger.groupEnd();
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
        VALUES (${userId}, ${timeoutType}, ${reason}, ${issuedBy}, ${expiresAt})
      `;

      return true;
    } catch (error) {
      logger.group('issueTimeout');
      logger.error('Error issuing timeout', error as Error, {
        userId,
        timeoutType,
        reason,
        durationHours,
        issuedBy
      });
      logger.groupEnd();
      return false;
    }
  }

  /**
   * Revoke a user timeout
   */
  static async revokeTimeout(
    timeoutId: number,
    revokedBy: number,
    reason?: string
  ): Promise<boolean> {
    try {
      await sql`
        UPDATE user_timeouts 
        SET is_active = false, revoked_by = ${revokedBy}, revoked_at = CURRENT_TIMESTAMP, revoke_reason = ${reason || null}
        WHERE id = ${timeoutId}
      `;

      return true;
    } catch (error) {
      logger.group('revokeTimeout');
      logger.error('Error revoking timeout', error as Error, {
        timeoutId,
        revokedBy,
        reason
      });
      logger.groupEnd();
      return false;
    }
  }

  /**
   * Grant a permission to a user
   */
  static async grantPermission(
    userId: number,
    permissionName: string,
    grantedBy: number,
    reason?: string,
    expiresAt?: Date
  ): Promise<boolean> {
    try {
      // Get permission ID
      const permissionResult = await sql<PermissionIdResult[]>`
        SELECT id FROM permissions WHERE name = ${permissionName}
      `;

      if (permissionResult.length === 0) {
        logger.warn('Permission not found', {
          permissionName,
          userId,
          grantedBy
        });
        return false;
      }

      const permissionId = permissionResult[0].id;

      // Insert or update permission
      await sql`
        INSERT INTO user_permissions (user_id, permission_id, granted, granted_by, reason, expires_at)
        VALUES (${userId}, ${permissionId}, true, ${grantedBy}, ${reason || null}, ${expiresAt || null})
        ON CONFLICT (user_id, permission_id) 
        DO UPDATE SET 
          granted = true,
          granted_by = ${grantedBy},
          granted_at = CURRENT_TIMESTAMP,
          reason = ${reason || null},
          expires_at = ${expiresAt || null}
      `;

      return true;
    } catch (error) {
      logger.group('grantPermission');
      logger.error('Error granting permission', error as Error, {
        userId,
        permissionName,
        grantedBy,
        reason
      });
      logger.groupEnd();
      return false;
    }
  }

  /**
   * Revoke a permission from a user
   */
  static async revokePermission(
    userId: number,
    permissionName: string,
    revokedBy: number,
    reason?: string
  ): Promise<boolean> {
    try {
      // Get permission ID
      const permissionResult = await sql<PermissionIdResult[]>`
        SELECT id FROM permissions WHERE name = ${permissionName}
      `;

      if (permissionResult.length === 0) {
        logger.warn('Permission not found', {
          permissionName,
          userId,
          revokedBy
        });
        return false;
      }

      const permissionId = permissionResult[0].id;

      // Insert or update permission (denied)
      await sql`
        INSERT INTO user_permissions (user_id, permission_id, granted, granted_by, reason)
        VALUES (${userId}, ${permissionId}, false, ${revokedBy}, ${reason || null})
        ON CONFLICT (user_id, permission_id) 
        DO UPDATE SET 
          granted = false,
          granted_by = ${revokedBy},
          granted_at = CURRENT_TIMESTAMP,
          reason = ${reason || null}
      `;

      return true;
    } catch (error) {
      logger.group('revokePermission');
      logger.error('Error revoking permission', error as Error, {
        userId,
        permissionName,
        revokedBy,
        reason
      });
      logger.groupEnd();
      return false;
    }
  }

  /**
   * Assign a role to a user
   */
  static async assignRole(
    userId: number,
    roleName: string,
    assignedBy: number,
    expiresAt?: Date
  ): Promise<boolean> {
    try {
      // Get role ID first
      const roleResult = await sql<RoleQueryResult[]>`
        SELECT id FROM user_roles WHERE name = ${roleName}
      `;

      if (roleResult.length === 0) {
        logger.error('Role not found', undefined, {
          roleName,
          userId,
          assignedBy
        });
        return false;
      }

      const roleId = roleResult[0].id;

      // Check if role assignment already exists
      const existingAssignment = await sql`
        SELECT id FROM user_role_assignments 
        WHERE user_id = ${userId} AND role_id = ${roleId} AND is_active = true
      `;

      if (existingAssignment.length > 0) {
        logger.error('Role already assigned to user', undefined, {
          userId,
          roleName,
          assignedBy
        });
        return false;
      }

      // Insert role assignment
      await sql`
        INSERT INTO user_role_assignments (user_id, role_id, assigned_by, expires_at)
        VALUES (${userId}, ${roleId}, ${assignedBy}, ${expiresAt || null})
        ON CONFLICT (user_id, role_id) 
        DO UPDATE SET 
          is_active = true,
          assigned_by = ${assignedBy},
          assigned_at = CURRENT_TIMESTAMP,
          expires_at = ${expiresAt || null}
      `;

      // Log successful role assignment (using error for visibility in production logs)
      logger.group('assignRole');
      logger.error(
        `AUDIT: Role ${roleName} assigned to user ${userId} by user ${assignedBy}`,
        undefined,
        {
          userId,
          roleName,
          roleId,
          assignedBy,
          action: 'ROLE_ASSIGNED',
          audit: true
        }
      );
      logger.groupEnd();

      return true;
    } catch (error) {
      logger.group('assignRole');
      logger.error('Error assigning role', error as Error, {
        userId,
        roleName,
        assignedBy
      });
      logger.groupEnd();
      return false;
    }
  }

  /**
   * Remove a role from a user
   */
  static async removeRole(
    userId: number,
    roleName: string,
    removedBy: number
  ): Promise<boolean> {
    try {
      // Get role ID first
      const roleResult = await sql<RoleQueryResult[]>`
        SELECT id FROM user_roles WHERE name = ${roleName}
      `;

      if (roleResult.length === 0) {
        logger.error('Role not found', undefined, {
          roleName,
          userId,
          removedBy
        });
        return false;
      }

      const roleId = roleResult[0].id;

      // Check if user has this role
      const existingAssignment = await sql`
        SELECT id FROM user_role_assignments 
        WHERE user_id = ${userId} AND role_id = ${roleId} AND is_active = true
      `;

      if (existingAssignment.length === 0) {
        logger.error('User does not have this role', undefined, {
          userId,
          roleName,
          removedBy
        });
        return false;
      }

      // Deactivate role assignment
      await sql`
        UPDATE user_role_assignments 
        SET is_active = false, removed_by = ${removedBy}, removed_at = CURRENT_TIMESTAMP
        WHERE user_id = ${userId} AND role_id = ${roleId}
      `;

      // Log successful role removal
      logger.group('removeRole');
      logger.error(
        `AUDIT: Role ${roleName} removed from user ${userId} by user ${removedBy}`,
        undefined,
        {
          userId,
          roleName,
          roleId,
          removedBy,
          action: 'ROLE_REMOVED',
          audit: true
        }
      );
      logger.groupEnd();

      return true;
    } catch (error) {
      logger.group('removeRole');
      logger.error('Error removing role', error as Error, {
        userId,
        roleName,
        removedBy
      });
      logger.groupEnd();
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
      logger.group('getAllPermissions');
      logger.error('Error getting all permissions', error as Error);
      logger.groupEnd();
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
      logger.group('getAllRoles');
      logger.error('Error getting all roles', error as Error);
      logger.groupEnd();
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
      logger.group('getPermissionsByCategory');
      logger.error('Error getting permissions by category', error as Error, {
        category
      });
      logger.groupEnd();
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

  const result = await PermissionsService.hasPermission('admin.access');

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
