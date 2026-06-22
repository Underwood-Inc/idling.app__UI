/**
 * Admin User Timeout Management API
 * Handles issuing and managing user timeouts
 */

import { withUniversalEnhancements } from '@lib/api/withUniversalEnhancements';
import {
  PermissionsService,
  PERMISSIONS,
  TIMEOUT_TYPES
} from '@lib/permissions/permissions';
import {
  AdminTimeoutManagementSchema,
  AdminTimeoutRevocationParamsSchema,
  AdminTimeoutStatusParamsSchema
} from '@lib/schemas/admin-users.schema';
import { requireAdminApiAccess } from '@lib/security/requireAdminApiAccess';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// This route uses dynamic features (auth/headers) and should not be pre-rendered
export const dynamic = 'force-dynamic';

// POST /api/admin/users/timeout - Issue timeout to user
async function postHandler(request: NextRequest) {
  try {
    const access = await requireAdminApiAccess(PERMISSIONS.ADMIN.USERS_TIMEOUT);
    if (!access.granted) {
      return access.response;
    }

    // Validate request body
    const body = await request.json();
    const bodyResult = AdminTimeoutManagementSchema.safeParse(body);

    if (!bodyResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: bodyResult.error.issues
        },
        { status: 400 }
      );
    }

    const { userId, timeoutType, reason, durationHours } = bodyResult.data;

    const issuedBy = access.userId;

    // Issue the timeout
    const success = await PermissionsService.issueTimeout(
      userId,
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

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to issue timeout' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/timeout - Revoke timeout
async function deleteHandler(request: NextRequest) {
  try {
    const access = await requireAdminApiAccess(PERMISSIONS.ADMIN.USERS_TIMEOUT);
    if (!access.granted) {
      return access.response;
    }

    // Validate query parameters
    const { searchParams } = new URL(request.url);
    const paramsResult = AdminTimeoutRevocationParamsSchema.safeParse({
      id: searchParams.get('id'),
      reason: searchParams.get('reason')
    });

    if (!paramsResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid revocation parameters',
          details: paramsResult.error.issues
        },
        { status: 400 }
      );
    }

    const { id: timeoutId, reason = 'Revoked by administrator' } =
      paramsResult.data;

    const revokedBy = access.userId;

    // Revoke the timeout
    const success = await PermissionsService.revokeTimeout(
      parseInt(timeoutId.toString()),
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

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to revoke timeout' },
      { status: 500 }
    );
  }
}

// GET /api/admin/users/timeout - Get user timeout status
async function getHandler(request: NextRequest) {
  try {
    const access = await requireAdminApiAccess(PERMISSIONS.ADMIN.USERS_TIMEOUT);
    if (!access.granted) {
      return access.response;
    }

    // Validate query parameters
    const { searchParams } = new URL(request.url);
    const paramsResult = AdminTimeoutStatusParamsSchema.safeParse({
      userId: searchParams.get('userId'),
      type: searchParams.get('type')
    });

    if (!paramsResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid status query parameters',
          details: paramsResult.error.issues
        },
        { status: 400 }
      );
    }

    const { userId, type: timeoutType = TIMEOUT_TYPES.POST_CREATION } =
      paramsResult.data;

    // Check timeout status
    const timeoutStatus = await PermissionsService.checkUserTimeout(
      userId,
      timeoutType
    );

    return NextResponse.json(timeoutStatus);
  } catch (error) {
    console.error('Error checking timeout status:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to check timeout status' },
      { status: 500 }
    );
  }
}

// Apply permission wrappers to handlers
export const POST = withUniversalEnhancements(postHandler);
export const DELETE = withUniversalEnhancements(deleteHandler);
export const GET = withUniversalEnhancements(getHandler);
