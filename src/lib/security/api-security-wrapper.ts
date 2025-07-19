/**
 * API Security Wrapper
 *
 * SECURITY CRITICAL: Simplified wrapper for API routes that need comprehensive security
 * This handles the Edge Runtime compatibility issues by doing database validation
 * only in the actual API routes, not in middleware.
 */

import { auth } from '@lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { getSecureCacheBustingHeaders } from './secure-logout';
import { validateUserExistence, validateUserPermission } from './validation';

export interface ApiSecurityOptions {
  requireAuth?: boolean;
  requireActiveAccount?: boolean;
  requiredPermissions?: string[];
  allowGuestAccess?: boolean;
}

export interface ApiSecurityContext {
  userId: number;
  session: any;
  isAuthenticated: boolean;
  userExists: boolean;
  accountActive: boolean;
}

/**
 * SECURITY CRITICAL: Secure API wrapper
 * Use this to wrap API route handlers with comprehensive security
 */
export function withApiSecurity(
  handler: (
    request: NextRequest,
    context: ApiSecurityContext
  ) => Promise<NextResponse>,
  options: ApiSecurityOptions = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const {
      requireAuth = true,
      requireActiveAccount = true,
      requiredPermissions = [],
      allowGuestAccess = false
    } = options;

    try {
      // Step 1: Get session
      const session = await auth();
      const isAuthenticated = !!session?.user?.id;

      // Step 2: Check authentication
      if (requireAuth && !isAuthenticated && !allowGuestAccess) {
        const response = NextResponse.json(
          {
            error: 'Authentication required',
            code: 'AUTH_REQUIRED',
            requiresReauth: true
          },
          { status: 401 }
        );

        // Add security headers
        const secureHeaders = getSecureCacheBustingHeaders();
        Object.entries(secureHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });

        return response;
      }

      let securityContext: ApiSecurityContext = {
        userId: 0,
        session,
        isAuthenticated,
        userExists: false,
        accountActive: false
      };

      // Step 3: For authenticated users, validate existence and permissions
      if (isAuthenticated && session?.user?.id) {
        const userId = parseInt(session.user.id);
        if (!userId || isNaN(userId)) {
          const response = NextResponse.json(
            {
              error: 'Invalid session data',
              code: 'INVALID_SESSION',
              requiresReauth: true
            },
            { status: 401 }
          );

          const secureHeaders = getSecureCacheBustingHeaders();
          Object.entries(secureHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
          });

          return response;
        }

        securityContext.userId = userId;

        // Validate user existence and account status
        const userValidation = await validateUserExistence(userId);
        securityContext.userExists = userValidation.isValid;
        securityContext.accountActive = userValidation.user?.is_active || false;

        if (!userValidation.isValid) {
          const response = NextResponse.json(
            {
              error: userValidation.error || 'Account access denied',
              code: userValidation.code || 'ACCOUNT_DENIED',
              requiresReauth: true
            },
            {
              status: userValidation.code === 'USER_NOT_FOUND' ? 404 : 403
            }
          );

          const secureHeaders = getSecureCacheBustingHeaders();
          Object.entries(secureHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
          });

          return response;
        }

        if (requireActiveAccount && !securityContext.accountActive) {
          const response = NextResponse.json(
            {
              error: 'Account is not active',
              code: 'ACCOUNT_INACTIVE',
              requiresReauth: true
            },
            { status: 403 }
          );

          const secureHeaders = getSecureCacheBustingHeaders();
          Object.entries(secureHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
          });

          return response;
        }

        // Check permissions
        for (const permission of requiredPermissions) {
          const permissionValidation = await validateUserPermission(
            userId,
            permission
          );

          if (!permissionValidation.hasPermission) {
            const response = NextResponse.json(
              {
                error: `Permission required: ${permission}`,
                code: 'INSUFFICIENT_PERMISSIONS'
              },
              { status: 403 }
            );

            const secureHeaders = getSecureCacheBustingHeaders();
            Object.entries(secureHeaders).forEach(([key, value]) => {
              response.headers.set(key, value);
            });

            return response;
          }
        }
      }

      // Security checks passed - call the handler
      const response = await handler(request, securityContext);

      // Add security headers to the response
      const secureHeaders = getSecureCacheBustingHeaders();
      Object.entries(secureHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    } catch (error) {
      console.error('❌ SECURITY: API security check failed:', error);

      const response = NextResponse.json(
        {
          error: 'Security validation failed',
          code: 'SECURITY_ERROR'
        },
        { status: 500 }
      );

      const secureHeaders = getSecureCacheBustingHeaders();
      Object.entries(secureHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    }
  };
}

/**
 * Convenience wrapper for admin-only API routes
 */
export function withAdminApiSecurity(
  handler: (
    request: NextRequest,
    context: ApiSecurityContext
  ) => Promise<NextResponse>
) {
  return withApiSecurity(handler, {
    requireAuth: true,
    requireActiveAccount: true,
    requiredPermissions: ['admin.access']
  });
}
