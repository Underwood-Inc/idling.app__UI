/**
 * Admin Timeout Revocation API
 * Handles revoking/ending user timeouts early
 */

import { checkUserPermission } from '@/lib/actions/permissions.actions';
import { auth } from '@/lib/auth';
import sql from '@/lib/db';
import { PERMISSIONS } from '@/lib/permissions/permissions';
import { NextRequest, NextResponse } from 'next/server';

export interface RevokeTimeoutRequest {
  timeoutId: number;
  reason?: string;
}

export interface RevokeTimeoutResponse {
  success: boolean;
  message: string;
}

// POST /api/admin/users/timeout/revoke - Revoke a user timeout
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // Check if user has permission to manage timeouts
    const hasPermission = await checkUserPermission(
      userId,
      PERMISSIONS.ADMIN.USERS_TIMEOUT
    );
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { timeoutId, reason = 'Revoked by administrator' }: RevokeTimeoutRequest = await request.json();

    if (!timeoutId) {
      return NextResponse.json({ error: 'Timeout ID is required' }, { status: 400 });
    }

    // Directly update the timeout in the database
    const result = await sql`
      UPDATE user_timeouts 
      SET 
        is_active = false,
        expires_at = CURRENT_TIMESTAMP,
        reason = reason || ' [REVOKED: ' || ${reason} || ']',
        revoked_by = ${userId},
        revoked_at = CURRENT_TIMESTAMP,
        revoke_reason = ${reason}
      WHERE id = ${timeoutId}
        AND is_active = true 
        AND expires_at > CURRENT_TIMESTAMP
    `;

    if (result.count === 0) {
      return NextResponse.json({ 
        error: 'Failed to revoke timeout. Timeout may not exist or may already be expired.' 
      }, { status: 400 });
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