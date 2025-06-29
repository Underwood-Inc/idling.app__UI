/**
 * Admin User Timeout Management API
 * Handles issuing and managing user timeouts
 */

import { checkUserPermission } from '@/lib/actions/permissions.actions';
import { auth } from '@/lib/auth';
import sql from '@/lib/db';
import { PERMISSIONS } from '@/lib/permissions/permissions';
import { NextRequest, NextResponse } from 'next/server';

export interface TimeoutRequest {
  timeoutType: string;
  reason: string;
  expiresAt: string;
  duration?: number; // in hours
}

// POST /api/admin/users/[id]/timeout - Issue timeout to user
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminUserId = parseInt(session.user.id);
    const targetUserId = parseInt(params.id);

    if (isNaN(targetUserId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Check if user has permission to issue timeouts
    const hasPermission = await checkUserPermission(
      adminUserId,
      PERMISSIONS.ADMIN.USERS_MANAGE
    );
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body: TimeoutRequest = await request.json();
    const { timeoutType, reason, expiresAt, duration } = body;

    if (!timeoutType || !reason) {
      return NextResponse.json({ 
        error: 'Timeout type and reason are required' 
      }, { status: 400 });
    }

    // Calculate expiry if duration is provided instead of explicit date
    let finalExpiresAt = expiresAt;
    if (duration && !expiresAt) {
      const now = new Date();
      now.setHours(now.getHours() + duration);
      finalExpiresAt = now.toISOString();
    }

    if (!finalExpiresAt) {
      return NextResponse.json({ 
        error: 'Either expiresAt or duration must be provided' 
      }, { status: 400 });
    }

    // Check if user already has an active timeout of this type
    const existingTimeouts = await sql<{ id: number }[]>`
      SELECT id FROM user_timeouts 
      WHERE user_id = ${targetUserId} 
        AND timeout_type = ${timeoutType} 
        AND is_active = true
        AND expires_at > NOW()
    `;

    if (existingTimeouts.length > 0) {
      return NextResponse.json({ 
        error: `User already has an active ${timeoutType} timeout` 
      }, { status: 409 });
    }

    // Issue the timeout
    await sql`
      INSERT INTO user_timeouts (
        user_id, timeout_type, reason, expires_at, issued_by, created_at, is_active
      ) VALUES (
        ${targetUserId}, 
        ${timeoutType}, 
        ${reason}, 
        ${finalExpiresAt}, 
        ${adminUserId}, 
        NOW(), 
        true
      )
    `;

    return NextResponse.json({ 
      success: true, 
      message: `${timeoutType} timeout issued successfully`,
      expiresAt: finalExpiresAt
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to issue timeout' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id]/timeout - Remove/cancel timeout
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminUserId = parseInt(session.user.id);
    const targetUserId = parseInt(params.id);

    if (isNaN(targetUserId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Check if user has permission to manage timeouts
    const hasPermission = await checkUserPermission(
      adminUserId,
      PERMISSIONS.ADMIN.USERS_MANAGE
    );
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const timeoutId = searchParams.get('timeoutId');
    const timeoutType = searchParams.get('timeoutType');

    if (!timeoutId && !timeoutType) {
      return NextResponse.json({ 
        error: 'Either timeoutId or timeoutType is required' 
      }, { status: 400 });
    }

    let query;
    if (timeoutId) {
      // Cancel specific timeout by ID
      query = sql`
        UPDATE user_timeouts 
        SET is_active = false, updated_at = NOW()
        WHERE id = ${parseInt(timeoutId)} AND user_id = ${targetUserId}
      `;
    } else {
      // Cancel all active timeouts of specific type
      query = sql`
        UPDATE user_timeouts 
        SET is_active = false, updated_at = NOW()
        WHERE user_id = ${targetUserId} 
          AND timeout_type = ${timeoutType} 
          AND is_active = true
      `;
    }

    await query;

    return NextResponse.json({ 
      success: true, 
      message: 'Timeout cancelled successfully' 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to cancel timeout' },
      { status: 500 }
    );
  }
} 