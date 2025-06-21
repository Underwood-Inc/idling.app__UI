/**
 * Admin User Timeout Management API
 * Handles issuing and managing user timeouts
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../lib/auth';
import {
  PERMISSIONS,
  PermissionsService,
  requirePermission,
  TIMEOUT_TYPES
} from '../../../../../lib/permissions/permissions';

// POST /api/admin/users/timeout - Issue timeout to user
export async function POST(request: NextRequest) {
  try {
    // Check admin permissions
    if (!(await requirePermission(PERMISSIONS.ADMIN.USERS_TIMEOUT))) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, timeoutType, reason, durationHours } = body;

    // Validate input
    if (!userId || !timeoutType || !reason || !durationHours) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!Object.values(TIMEOUT_TYPES).includes(timeoutType)) {
      return NextResponse.json(
        { error: 'Invalid timeout type' },
        { status: 400 }
      );
    }

    if (durationHours < 1 || durationHours > 8760) {
      // Max 1 year
      return NextResponse.json(
        { error: 'Invalid duration (1-8760 hours)' },
        { status: 400 }
      );
    }

    const issuedBy = parseInt(session.user.id);

    // Issue the timeout
    const success = await PermissionsService.issueTimeout(
      parseInt(userId),
      timeoutType,
      reason,
      durationHours,
      issuedBy
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to issue timeout' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Timeout issued successfully'
    });
  } catch (error) {
    console.error('Error issuing timeout:', error);
    return NextResponse.json(
      { error: 'Failed to issue timeout' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/timeout - Revoke timeout
export async function DELETE(request: NextRequest) {
  try {
    // Check admin permissions
    if (!(await requirePermission(PERMISSIONS.ADMIN.USERS_TIMEOUT))) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeoutId = searchParams.get('id');
    const reason = searchParams.get('reason') || 'Revoked by administrator';

    if (!timeoutId) {
      return NextResponse.json(
        { error: 'Timeout ID required' },
        { status: 400 }
      );
    }

    const revokedBy = parseInt(session.user.id);

    // Revoke the timeout
    const success = await PermissionsService.revokeTimeout(
      parseInt(timeoutId),
      revokedBy,
      reason
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to revoke timeout' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Timeout revoked successfully'
    });
  } catch (error) {
    console.error('Error revoking timeout:', error);
    return NextResponse.json(
      { error: 'Failed to revoke timeout' },
      { status: 500 }
    );
  }
}

// GET /api/admin/users/timeout - Get user timeout status
export async function GET(request: NextRequest) {
  try {
    // Check admin permissions
    if (!(await requirePermission(PERMISSIONS.ADMIN.USERS_VIEW))) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const timeoutType = searchParams.get('type') || TIMEOUT_TYPES.POST_CREATION;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Check timeout status
    const timeoutStatus = await PermissionsService.checkUserTimeout(
      parseInt(userId),
      timeoutType
    );

    return NextResponse.json(timeoutStatus);
  } catch (error) {
    console.error('Error checking timeout status:', error);
    return NextResponse.json(
      { error: 'Failed to check timeout status' },
      { status: 500 }
    );
  }
}
