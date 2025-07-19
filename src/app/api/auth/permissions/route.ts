import { auth } from '@lib/auth';
import { PermissionsService } from '@lib/permissions/permissions';
import { validateUserExistence } from '@lib/security/validation';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/permissions
 *
 * SECURITY CRITICAL: Returns the current user's permissions for client-side security validation
 * This endpoint is used by the client-side security guard to validate permissions
 */
export async function GET(request: NextRequest) {
  try {
    // Get current session
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          authenticated: false,
          permissions: [],
          roles: []
        },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);

    if (!userId || isNaN(userId)) {
      return NextResponse.json(
        {
          error: 'Invalid user ID',
          authenticated: false,
          permissions: [],
          roles: []
        },
        { status: 401 }
      );
    }

    // Validate user still exists and is active
    const userValidation = await validateUserExistence(userId);

    if (!userValidation.isValid) {
      return NextResponse.json(
        {
          error: userValidation.error || 'User validation failed',
          code: userValidation.code,
          authenticated: false,
          permissions: [],
          roles: [],
          requiresReauth: true
        },
        { status: userValidation.code === 'USER_NOT_FOUND' ? 404 : 403 }
      );
    }

    // Get user permissions and roles
    const [userPermissions, userRoles] = await Promise.all([
      PermissionsService.getUserPermissions(userId),
      PermissionsService.getUserRoles(userId)
    ]);

    return NextResponse.json({
      authenticated: true,
      userId: userId,
      permissions: userPermissions.map((p: any) => p.name),
      roles: userRoles.map((r: any) => r.name),
      user: {
        id: userValidation.user?.id,
        name: userValidation.user?.name,
        email: userValidation.user?.email,
        is_active: userValidation.user?.is_active
      },
      lastValidated: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ SECURITY: Permission check failed:', error);

    return NextResponse.json(
      {
        error: 'Permission check failed',
        authenticated: false,
        permissions: [],
        roles: []
      },
      { status: 500 }
    );
  }
}
