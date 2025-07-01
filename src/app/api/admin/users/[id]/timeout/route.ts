/**
 * Admin User Timeout Management API
 * Handles issuing and managing user timeouts
 */

import { checkUserPermission } from '@/lib/actions/permissions.actions';
import { auth } from '@/lib/auth';
import sql from '@/lib/db';
import { PERMISSIONS } from '@/lib/permissions/permissions';
import { AdminUserTimeoutCancelParamsSchema, AdminUserTimeoutRequestSchema, UserIdParamsSchema } from '@/lib/schemas/admin-users.schema';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

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

    // Validate params
    const paramsResult = UserIdParamsSchema.safeParse(params);
    if (!paramsResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid user ID format',
          details: paramsResult.error.errors 
        },
        { status: 400 }
      );
    }

    const targetUserId = parseInt(paramsResult.data.id);

    // Check if user has permission to issue timeouts
    const hasPermission = await checkUserPermission(
      adminUserId,
      PERMISSIONS.ADMIN.USERS_MANAGE
    );
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Validate request body
    const body = await request.json();
    const bodyResult = AdminUserTimeoutRequestSchema.safeParse(body);
    
    if (!bodyResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: bodyResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { timeoutType, reason, expiresAt, duration } = bodyResult.data;

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

    // Validate query parameters
    const { searchParams } = new URL(request.url);
    const paramsResult = AdminUserTimeoutCancelParamsSchema.safeParse({
      timeoutId: searchParams.get('timeoutId'),
      timeoutType: searchParams.get('timeoutType'),
    });

    if (!paramsResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid cancellation parameters',
          details: paramsResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { timeoutId, timeoutType } = paramsResult.data;

    let query;
    if (timeoutId) {
      // Cancel specific timeout by ID
      query = sql`
        UPDATE user_timeouts 
        SET is_active = false, updated_at = NOW()
        WHERE id = ${parseInt(timeoutId.toString())} AND user_id = ${targetUserId}
      `;
    } else if (timeoutType) {
      // Cancel all active timeouts of specific type
      query = sql`
        UPDATE user_timeouts 
        SET is_active = false, updated_at = NOW()
        WHERE user_id = ${targetUserId} 
          AND timeout_type = ${timeoutType} 
          AND is_active = true
      `;
    } else {
      // This should never happen due to schema validation, but be defensive
      return NextResponse.json({ 
        error: 'Either timeoutId or timeoutType must be provided' 
      }, { status: 400 });
    }

    await query;

    return NextResponse.json({ 
      success: true, 
      message: 'Timeout cancelled successfully' 
    });
  } catch (error) {
    console.error('Error cancelling timeout:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to cancel timeout' },
      { status: 500 }
    );
  }
} 