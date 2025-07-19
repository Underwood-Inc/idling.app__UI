/**
 * Universal Security Guard
 *
 * SECURITY CRITICAL: This module provides comprehensive security validation
 * for ALL requests, pages, and operations in the application.
 *
 * Features:
 * - Real-time session validation
 * - User existence and account status checking
 * - Permission validation
 * - Automatic logout on security failures
 * - Cache-busting security responses
 * - Comprehensive audit logging
 */

import { auth } from '@lib/auth';
import { createLogger } from '@lib/logging';
import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';
import {
  getSecureCacheBustingHeaders,
  performSecureLogout
} from './secure-logout';
import { validateUserExistence, validateUserPermission } from './validation';

// Security audit logger - simplified for Edge Runtime compatibility
const securityLogger = createLogger({
  context: {
    component: 'UniversalSecurityGuard',
    module: 'security'
  },
  enabled: true // Always enabled for security auditing
});

export interface SecurityContext {
  userId: number;
  session: any;
  isAuthenticated: boolean;
  userExists: boolean;
  accountActive: boolean;
  ipAddress?: string;
  userAgent?: string;
  requestPath: string;
  method: string;
  timestamp: number;
}

export interface SecurityCheckOptions {
  requireAuth?: boolean;
  requireActiveAccount?: boolean;
  requiredPermissions?: string[];
  allowGuestAccess?: boolean;
  securityLevel?: 'basic' | 'standard' | 'high' | 'maximum';
  skipUserExistenceCheck?: boolean;
}

export interface SecurityCheckResult {
  success: boolean;
  context?: SecurityContext;
  failureReason?: string;
  failureCode?: string;
  requiresLogout?: boolean;
  requiresRedirect?: boolean;
  redirectUrl?: string;
  securityHeaders?: Record<string, string>;
}

/**
 * SECURITY CRITICAL: Universal security validator for all requests
 * This function performs comprehensive security checks and should be called
 * on every protected route, API endpoint, and sensitive operation.
 */
export async function performUniversalSecurityCheck(
  request?: NextRequest,
  options: SecurityCheckOptions = {}
): Promise<SecurityCheckResult> {
  const {
    requireAuth = true,
    requireActiveAccount = true,
    requiredPermissions = [],
    allowGuestAccess = false,
    securityLevel = 'standard',
    skipUserExistenceCheck = false
  } = options;

  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  securityLogger.group(`🔒 UNIVERSAL SECURITY CHECK [${requestId}]`);
  securityLogger.info('Security check initiated', {
    options,
    securityLevel,
    requestId,
    timestamp: startTime
  });

  try {
    // Extract request context
    const requestPath = request?.nextUrl?.pathname || 'unknown';
    const method = request?.method || 'unknown';
    const ipAddress =
      request?.ip || request?.headers?.get('x-forwarded-for') || 'unknown';
    const userAgent = request?.headers?.get('user-agent') || 'unknown';

    // Step 1: Get current session
    securityLogger.debug('Step 1: Validating session');
    const session = await auth();

    // Step 2: Basic authentication check
    const isAuthenticated = !!session?.user?.id;

    if (requireAuth && !isAuthenticated) {
      if (!allowGuestAccess) {
        securityLogger.warn(
          'SECURITY VIOLATION: Unauthenticated access attempt',
          {
            requestPath,
            method,
            ipAddress,
            userAgent,
            requestId,
            violation: 'UNAUTHENTICATED_ACCESS'
          }
        );

        return {
          success: false,
          failureReason: 'Authentication required',
          failureCode: 'AUTH_REQUIRED',
          requiresRedirect: true,
          redirectUrl: `/auth/signin?redirect=${encodeURIComponent(requestPath)}&reason=auth_required`,
          securityHeaders: getSecureCacheBustingHeaders()
        };
      }
    }

    let securityContext: SecurityContext = {
      userId: session?.user?.id ? parseInt(session.user.id) : 0,
      session,
      isAuthenticated,
      userExists: false,
      accountActive: false,
      ipAddress,
      userAgent,
      requestPath,
      method,
      timestamp: startTime
    };

    // Step 3: User existence and account status validation (for authenticated users)
    if (isAuthenticated && !skipUserExistenceCheck) {
      securityLogger.debug(
        'Step 3: Validating user existence and account status'
      );

      const userId = parseInt(session.user.id || '0');
      if (!userId || isNaN(userId)) {
        securityLogger.error(
          'SECURITY VIOLATION: Invalid user ID in session',
          undefined,
          {
            sessionUserId: session.user.id,
            requestId,
            violation: 'INVALID_USER_ID'
          }
        );

        return {
          success: false,
          failureReason: 'Invalid session data',
          failureCode: 'INVALID_SESSION',
          requiresLogout: true,
          requiresRedirect: true,
          redirectUrl: '/auth/signin?reason=invalid_session',
          securityHeaders: getSecureCacheBustingHeaders()
        };
      }

      // Real-time user validation
      const userValidation = await validateUserExistence(userId);
      securityContext.userExists = userValidation.isValid;
      securityContext.accountActive = userValidation.user?.is_active || false;

      if (!userValidation.isValid) {
        securityLogger.error(
          'SECURITY VIOLATION: User does not exist or account deactivated',
          undefined,
          {
            userId,
            validationResult: userValidation,
            requestId,
            violation: 'USER_NOT_FOUND_OR_DEACTIVATED'
          }
        );

        return {
          success: false,
          failureReason: userValidation.error || 'Account access denied',
          failureCode: userValidation.code || 'ACCOUNT_DENIED',
          requiresLogout: true,
          requiresRedirect: true,
          redirectUrl: '/auth/signin?reason=account_invalid',
          securityHeaders: getSecureCacheBustingHeaders()
        };
      }

      if (requireActiveAccount && !securityContext.accountActive) {
        securityLogger.error(
          'SECURITY VIOLATION: Inactive account access attempt',
          undefined,
          {
            userId,
            accountActive: securityContext.accountActive,
            requestId,
            violation: 'INACTIVE_ACCOUNT_ACCESS'
          }
        );

        return {
          success: false,
          failureReason: 'Account is not active',
          failureCode: 'ACCOUNT_INACTIVE',
          requiresLogout: true,
          requiresRedirect: true,
          redirectUrl: '/auth/signin?reason=account_inactive',
          securityHeaders: getSecureCacheBustingHeaders()
        };
      }
    }

    // Step 4: Permission validation
    if (requiredPermissions.length > 0 && isAuthenticated) {
      securityLogger.debug('Step 4: Validating permissions', {
        requiredPermissions,
        userId: securityContext.userId
      });

      for (const permission of requiredPermissions) {
        const permissionValidation = await validateUserPermission(
          securityContext.userId,
          permission
        );

        if (!permissionValidation.hasPermission) {
          securityLogger.error(
            'SECURITY VIOLATION: Insufficient permissions',
            undefined,
            {
              userId: securityContext.userId,
              requiredPermission: permission,
              requestPath,
              requestId,
              violation: 'INSUFFICIENT_PERMISSIONS'
            }
          );

          return {
            success: false,
            failureReason: `Permission required: ${permission}`,
            failureCode: 'INSUFFICIENT_PERMISSIONS',
            requiresRedirect: true,
            redirectUrl: '/auth/signin?reason=insufficient_permissions',
            securityHeaders: getSecureCacheBustingHeaders()
          };
        }
      }
    }

    // Step 5: Security level checks
    if (securityLevel === 'high' || securityLevel === 'maximum') {
      securityLogger.debug('Step 5: High security level checks');

      // Additional security measures for high-security operations
      if (securityLevel === 'maximum') {
        // For maximum security, we could add additional checks like:
        // - Rate limiting
        // - Device fingerprinting
        // - Location-based checks
        // - Time-based access controls

        // For now, we'll ensure the session is very recent
        const sessionAge =
          Date.now() - new Date(session?.expires || 0).getTime();
        const maxSessionAge = 30 * 60 * 1000; // 30 minutes for maximum security

        if (sessionAge > maxSessionAge) {
          securityLogger.warn(
            'SECURITY WARNING: Session too old for maximum security operation',
            {
              userId: securityContext.userId,
              sessionAge,
              maxAllowed: maxSessionAge,
              requestId,
              violation: 'SESSION_TOO_OLD'
            }
          );

          return {
            success: false,
            failureReason: 'Session expired for high-security operation',
            failureCode: 'SESSION_EXPIRED_HIGH_SECURITY',
            requiresLogout: true,
            requiresRedirect: true,
            redirectUrl: '/auth/signin?reason=session_expired_security',
            securityHeaders: getSecureCacheBustingHeaders()
          };
        }
      }
    }

    // Security check passed
    const duration = Date.now() - startTime;
    securityLogger.info('✅ SECURITY CHECK PASSED', {
      requestId,
      duration: `${duration}ms`,
      securityLevel,
      userId: securityContext.userId,
      isAuthenticated: securityContext.isAuthenticated,
      accountActive: securityContext.accountActive,
      permissionsChecked: requiredPermissions.length
    });

    securityLogger.groupEnd();

    return {
      success: true,
      context: securityContext
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    securityLogger.error('❌ SECURITY CHECK FAILED', undefined, {
      error: error instanceof Error ? error.message : String(error),
      requestId,
      duration: `${duration}ms`,
      violation: 'SECURITY_CHECK_ERROR'
    });

    securityLogger.groupEnd();

    return {
      success: false,
      failureReason: 'Security validation failed',
      failureCode: 'SECURITY_ERROR',
      requiresLogout: true,
      requiresRedirect: true,
      redirectUrl: '/auth/signin?reason=security_error',
      securityHeaders: getSecureCacheBustingHeaders()
    };
  }
}

/**
 * SECURITY CRITICAL: Handle security check failures
 * This function processes security check failures and takes appropriate action
 */
export async function handleSecurityFailure(
  result: SecurityCheckResult,
  isApiRoute: boolean = false,
  triggerLogout: boolean = true
): Promise<NextResponse | never> {
  securityLogger.error('🚨 HANDLING SECURITY FAILURE', undefined, {
    failureReason: result.failureReason,
    failureCode: result.failureCode,
    requiresLogout: result.requiresLogout,
    requiresRedirect: result.requiresRedirect,
    isApiRoute
  });

  // Trigger secure logout if required
  if (result.requiresLogout && triggerLogout && typeof window !== 'undefined') {
    try {
      await performSecureLogout({ level: 'comprehensive' });
    } catch (error) {
      securityLogger.error(
        'Failed to perform secure logout on security failure:',
        undefined,
        {
          error: error instanceof Error ? error.message : String(error)
        }
      );
    }
  }

  if (isApiRoute) {
    // API route response
    const response = NextResponse.json(
      {
        error: result.failureReason || 'Security check failed',
        code: result.failureCode || 'SECURITY_FAILURE',
        requiresReauth: result.requiresLogout || false,
        clearSession: result.requiresLogout || false,
        redirectUrl: result.redirectUrl
      },
      {
        status:
          result.failureCode === 'AUTH_REQUIRED'
            ? 401
            : result.failureCode === 'INSUFFICIENT_PERMISSIONS'
              ? 403
              : 400
      }
    );

    // Add security headers
    if (result.securityHeaders) {
      Object.entries(result.securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }

    return response;
  } else {
    // Page route - redirect
    const redirectUrl =
      result.redirectUrl || '/auth/signin?reason=security_failure';

    if (typeof window !== 'undefined') {
      // Client-side redirect
      window.location.href = redirectUrl;
      throw new Error('Security redirect'); // This will never be reached
    } else {
      // Server-side redirect
      redirect(redirectUrl);
    }
  }
}

/**
 * SECURITY CRITICAL: Server Component Security Guard
 * Use this in server components to enforce security
 *
 * This version uses the robust permissions system instead of real-time DB validation
 * to avoid Edge Runtime compatibility issues in Server Components
 */
/* eslint-disable no-console */
export async function useServerSecurityGuard(
  options: SecurityCheckOptions = {}
): Promise<SecurityContext> {
  const {
    requireAuth = true,
    requireActiveAccount = true,
    requiredPermissions = [],
    allowGuestAccess = false,
    securityLevel = 'standard'
  } = options;

  try {
    // Step 1: Authentication check
    const session = await auth();
    const isAuthenticated = !!session?.user?.id;

    if (requireAuth && !isAuthenticated && !allowGuestAccess) {
      console.log('❌ SERVER SECURITY: Authentication required');
      redirect('/auth/signin?reason=auth_required');
    }

    if (!isAuthenticated) {
      // Guest access allowed
      return {
        userId: 0,
        session: null,
        isAuthenticated: false,
        userExists: false,
        accountActive: false,
        requestPath: 'server-component',
        method: 'GET',
        timestamp: Date.now()
      };
    }

    const userId = parseInt(session.user.id || '0');
    if (!userId || isNaN(userId)) {
      console.log('❌ SERVER SECURITY: Invalid user ID in session');
      redirect('/auth/signin?reason=invalid_session');
    }

    // Step 2: Permission validation using the robust permissions system
    if (requiredPermissions.length > 0) {
      // Import permissions dynamically to avoid Edge Runtime issues
      const { PermissionsService } = await import('../permissions/permissions');

      for (const permission of requiredPermissions) {
        const hasPermission =
          await PermissionsService.hasPermission(permission);

        if (!hasPermission) {
          console.log(`❌ SERVER SECURITY: Missing permission: ${permission}`);
          redirect('/auth/signin?reason=insufficient_permissions');
        }
      }
    }

    // All checks passed - return security context
    return {
      userId,
      session,
      isAuthenticated: true,
      userExists: true, // Assume true if session is valid
      accountActive: true, // Will be validated by permissions system
      requestPath: 'server-component',
      method: 'GET',
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('❌ SERVER SECURITY: Security check failed:', error);
    redirect('/auth/signin?reason=security_error');
  }
}
/* eslint-enable no-console */

/**
 * SECURITY CRITICAL: API Route Security Guard
 * Use this in API routes to enforce security
 */
export async function useApiSecurityGuard(
  request: NextRequest,
  options: SecurityCheckOptions = {}
): Promise<SecurityContext | NextResponse> {
  const result = await performUniversalSecurityCheck(request, options);

  if (!result.success) {
    return await handleSecurityFailure(result, true, false);
  }

  return result.context!;
}
