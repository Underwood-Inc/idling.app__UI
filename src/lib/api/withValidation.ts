/**
 * API Route Validation Wrapper System
 * 
 * Provides scalable, reusable validation for API routes without duplication
 * Handles user existence, permissions, and other security checks consistently
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../auth';
import { createValidationFailureResponse, validateUserExistence, validateUserPermission } from '../security/validation';

export interface ValidationConfig {
  requireAuth?: boolean;
  requirePermission?: string;
  allowedMethods?: string[];
  requireUserExists?: boolean;
}

export interface ValidatedRequest extends NextRequest {
  user?: {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    created_at: Date;
  };
  session?: any;
}

export interface ApiRouteHandler {
  (req: ValidatedRequest, context?: any): Promise<NextResponse>;
}

/**
 * Higher-order function that wraps API routes with validation
 * 
 * @param handler - The API route handler function
 * @param config - Validation configuration
 * @returns Wrapped handler with validation
 */
export function withValidation(
  handler: ApiRouteHandler,
  config: ValidationConfig = {}
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    const {
      requireAuth = true,
      requirePermission,
      allowedMethods,
      requireUserExists = true
    } = config;

    try {
      // Method validation
      if (allowedMethods && !allowedMethods.includes(req.method || 'GET')) {
        return NextResponse.json(
          { error: 'Method not allowed' },
          { status: 405 }
        );
      }

      // Authentication check
      if (requireAuth) {
        const session = await auth();
        if (!session?.user?.id) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }

        const userId = parseInt(session.user.id);
        if (!userId || isNaN(userId)) {
          return NextResponse.json(
            { error: 'Invalid session' },
            { status: 401 }
          );
        }

        // User existence validation
        if (requireUserExists) {
          const userValidation = await validateUserExistence(userId);
          if (!userValidation.isValid) {
            return createValidationFailureResponse(userValidation, true);
          }

          // Add validated user to request
          (req as ValidatedRequest).user = userValidation.user;
        }

        // Permission validation
        if (requirePermission) {
          const permissionValidation = await validateUserPermission(userId, requirePermission);
          if (!permissionValidation.hasPermission) {
            return createValidationFailureResponse(permissionValidation, true);
          }
        }

        // Add session to request
        (req as ValidatedRequest).session = session;
      }

      // Call the original handler with validated request
      return await handler(req as ValidatedRequest, context);

    } catch (error) {
      console.error('❌ API validation wrapper error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Convenience wrapper for admin-only routes
 */
export function withAdminValidation(handler: ApiRouteHandler) {
  return withValidation(handler, {
    requireAuth: true,
    requireUserExists: true,
    requirePermission: 'admin.permissions.view' // This should match your admin permission
  });
}

/**
 * Convenience wrapper for authenticated routes (no specific permissions)
 */
export function withAuthValidation(handler: ApiRouteHandler) {
  return withValidation(handler, {
    requireAuth: true,
    requireUserExists: true
  });
}

/**
 * Convenience wrapper for public routes with optional auth
 */
export function withOptionalAuth(handler: ApiRouteHandler) {
  return withValidation(handler, {
    requireAuth: false,
    requireUserExists: false
  });
}

/**
 * Method-specific validation helpers
 */
export function withMethodValidation(
  handler: ApiRouteHandler, 
  methods: string[], 
  config: ValidationConfig = {}
) {
  return withValidation(handler, {
    ...config,
    allowedMethods: methods
  });
}

/**
 * Convenience wrappers for common method patterns
 */
export const withGET = (handler: ApiRouteHandler, config?: ValidationConfig) =>
  withMethodValidation(handler, ['GET'], config);

export const withPOST = (handler: ApiRouteHandler, config?: ValidationConfig) =>
  withMethodValidation(handler, ['POST'], config);

export const withPUT = (handler: ApiRouteHandler, config?: ValidationConfig) =>
  withMethodValidation(handler, ['PUT'], config);

export const withDELETE = (handler: ApiRouteHandler, config?: ValidationConfig) =>
  withMethodValidation(handler, ['DELETE'], config);

export const withPATCH = (handler: ApiRouteHandler, config?: ValidationConfig) =>
  withMethodValidation(handler, ['PATCH'], config);

/**
 * Multi-method wrapper
 */
export function withMethods(methods: string[]) {
  return {
    auth: (handler: ApiRouteHandler) => 
      withMethodValidation(handler, methods, { requireAuth: true }),
    admin: (handler: ApiRouteHandler) => 
      withMethodValidation(handler, methods, { 
        requireAuth: true, 
        requirePermission: 'admin.permissions.view' 
      }),
    public: (handler: ApiRouteHandler) => 
      withMethodValidation(handler, methods, { requireAuth: false })
  };
}

/**
 * Example usage patterns:
 * 
 * // Basic authenticated route
 * export const GET = withAuthValidation(async (req) => {
 *   // req.user is guaranteed to exist and be validated
 *   return NextResponse.json({ user: req.user });
 * });
 * 
 * // Admin-only route
 * export const POST = withAdminValidation(async (req) => {
 *   // User is guaranteed to have admin permissions
 *   return NextResponse.json({ success: true });
 * });
 * 
 * // Method-specific with custom validation
 * export const PUT = withPUT(async (req) => {
 *   // Only PUT requests allowed
 *   return NextResponse.json({ updated: true });
 * }, { requirePermission: 'posts.edit' });
 * 
 * // Multiple methods with different permissions
 * export const GET = withMethods(['GET', 'POST']).auth(async (req) => {
 *   // Both GET and POST allowed for authenticated users
 *   return NextResponse.json({ method: req.method });
 * });
 */ 