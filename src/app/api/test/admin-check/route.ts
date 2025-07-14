/**
 * Test API endpoint to check admin permissions
 */

import { NextResponse } from 'next/server';
import { auth } from '../../../../lib/auth';
import {
  PermissionsService,
  requireAdmin
} from '../../../../lib/permissions/permissions';

// This route uses dynamic features (auth/headers) and should not be pre-rendered
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    const hasAdminAccess = await requireAdmin();

    if (!session?.user?.id) {
      return NextResponse.json({
        authenticated: false,
        hasAdminAccess: false,
        userId: null,
        userName: null
      });
    }

    const userId = parseInt(session.user.id);
    const userPermissions = await PermissionsService.getUserPermissions(userId);
    const userRoles = await PermissionsService.getUserRoles(userId);

    return NextResponse.json({
      authenticated: true,
      hasAdminAccess,
      userId: session.user.id,
      userName: session.user.name,
      roles: userRoles,
      permissions: userPermissions.map((p) => p.name)
    });
  } catch (error) {
    console.error('Error in admin check:', error);
    return NextResponse.json(
      { error: 'Failed to check admin status' },
      { status: 500 }
    );
  }
}
