/**
 * Comprehensive Security Validation Utilities
 * 
 * Provides real-time validation for user existence, account status, and permissions
 * Used by middleware and individual API routes for consistent security
 */

import { NextResponse } from 'next/server';

export interface UserValidationResult {
  isValid: boolean;
  user?: {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    created_at: Date;
  };
  error?: string;
  code?: string;
  requiresReauth?: boolean;
}

export interface PermissionValidationResult {
  hasPermission: boolean;
  error?: string;
  code?: string;
}

/**
 * Validates user existence and account status in real-time
 * This should be called on every authenticated request
 */
export async function validateUserExistence(userId: number): Promise<UserValidationResult> {
  try {
    if (!userId || isNaN(userId)) {
      return {
        isValid: false,
        error: 'Invalid user ID',
        code: 'INVALID_USER_ID',
        requiresReauth: true
      };
    }

    const { default: sql } = await import('../db');
    const userValidation = await sql`
      SELECT 
        id, 
        name, 
        email,
        is_active,
        created_at
      FROM users 
      WHERE id = ${userId}
    `;

    if (userValidation.length === 0) {
      console.error('❌ SECURITY: User not found in database:', userId);
      return {
        isValid: false,
        error: 'User account not found',
        code: 'USER_NOT_FOUND',
        requiresReauth: true
      };
    }

    const user = userValidation[0];

    // Check if user account is deactivated
    if (user.is_active === false) {
      console.warn('❌ SECURITY: Deactivated user attempting access:', userId);
      return {
        isValid: false,
        error: 'Account deactivated',
        code: 'ACCOUNT_DEACTIVATED',
        requiresReauth: true
      };
    }

    // Update last activity timestamp (lightweight tracking)
    await sql`
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP 
      WHERE id = ${userId}
    `;

    return {
      isValid: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        is_active: user.is_active !== false,
        created_at: user.created_at
      }
    };

  } catch (error) {
    console.error('❌ Error validating user existence:', error);
    return {
      isValid: false,
      error: 'User validation failed',
      code: 'VALIDATION_ERROR',
      requiresReauth: true
    };
  }
}

/**
 * Validates user permissions in real-time
 * This should be called for permission-protected routes
 */
export async function validateUserPermission(
  userId: number, 
  permission: string
): Promise<PermissionValidationResult> {
  try {
    const { checkUserPermission } = await import('../actions/permissions.actions');
    
    const hasPermission = await checkUserPermission(userId, permission);
    
    if (!hasPermission) {
      console.warn('❌ User lacks required permission:', { userId, permission });
      return {
        hasPermission: false,
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      };
    }

    return {
      hasPermission: true
    };

  } catch (error) {
    console.error('❌ Error validating user permission:', error);
    return {
      hasPermission: false,
      error: 'Permission check failed',
      code: 'PERMISSION_CHECK_ERROR'
    };
  }
}

/**
 * Validates admin permissions specifically
 * Convenience wrapper for admin permission checking
 */
export async function validateAdminPermission(userId: number): Promise<PermissionValidationResult> {
  const { PERMISSIONS } = await import('../permissions/permissions');
  return validateUserPermission(userId, PERMISSIONS.ADMIN.PERMISSIONS_VIEW);
}

/**
 * Creates appropriate NextResponse for validation failures
 * Handles both API and page route responses
 */
export function createValidationFailureResponse(
  validation: UserValidationResult | PermissionValidationResult,
  isApiRoute: boolean,
  redirectUrl?: string
): NextResponse {
  if (isApiRoute) {
    const status = validation.code === 'USER_NOT_FOUND' ? 404 : 
                  validation.code === 'ACCOUNT_DEACTIVATED' ? 403 :
                  validation.code === 'INSUFFICIENT_PERMISSIONS' ? 403 : 401;
    
    const response = NextResponse.json({
      error: validation.error,
      code: validation.code,
      requiresReauth: 'requiresReauth' in validation ? validation.requiresReauth : false,
      clearSession: 'requiresReauth' in validation ? validation.requiresReauth : false
    }, { status });

    // Clear session cookies if reauth is required
    if ('requiresReauth' in validation && validation.requiresReauth) {
      response.cookies.delete('next-auth.session-token');
      response.cookies.delete('__Secure-next-auth.session-token');
      response.cookies.delete('next-auth.csrf-token');
      response.cookies.delete('__Host-next-auth.csrf-token');
      response.cookies.delete('next-auth.callback-url');
      response.cookies.delete('__Secure-next-auth.callback-url');
      
      // Add header to trigger client-side session clearing
      response.headers.set('X-Clear-Session', 'true');
    }
    
    return response;
  } else {
    // Page route - redirect appropriately
    const url = redirectUrl || '/auth/signin';
    const response = NextResponse.redirect(new URL(url, 'http://localhost:3000'));
    
    // Clear session if reauth is required
    if ('requiresReauth' in validation && validation.requiresReauth) {
      response.cookies.delete('next-auth.session-token');
      response.cookies.delete('__Secure-next-auth.session-token');
      response.cookies.delete('next-auth.csrf-token');
      response.cookies.delete('__Host-next-auth.csrf-token');
      response.cookies.delete('next-auth.callback-url');
      response.cookies.delete('__Secure-next-auth.callback-url');
    }
    
    return response;
  }
}

/**
 * Comprehensive validation for authenticated requests
 * Combines user existence and permission checking
 */
export async function validateAuthenticatedRequest(
  userId: number,
  requiredPermission?: string
): Promise<{
  isValid: boolean;
  user?: UserValidationResult['user'];
  error?: string;
  code?: string;
  requiresReauth?: boolean;
}> {
  // First validate user existence
  const userValidation = await validateUserExistence(userId);
  if (!userValidation.isValid) {
    return {
      isValid: false,
      error: userValidation.error,
      code: userValidation.code,
      requiresReauth: userValidation.requiresReauth
    };
  }

  // If permission is required, validate it
  if (requiredPermission) {
    const permissionValidation = await validateUserPermission(userId, requiredPermission);
    if (!permissionValidation.hasPermission) {
      return {
        isValid: false,
        user: userValidation.user,
        error: permissionValidation.error,
        code: permissionValidation.code,
        requiresReauth: false
      };
    }
  }

  return {
    isValid: true,
    user: userValidation.user
  };
} 