/**
 * User Timeout Status API
 * Allows users to check their own timeout status
 */

import { withUniversalEnhancements } from '@lib/api/withUniversalEnhancements';
import { auth } from '@lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import {
  PermissionsService,
  TIMEOUT_TYPES
} from '../../../../lib/permissions/permissions';

// This route uses dynamic features (auth/headers) and should not be pre-rendered
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/user/timeout - Get current user's timeout status (with automatic validation)
async function getHandler(request: NextRequest) {
  try {
    // Get user session directly
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);
    const { searchParams } = new URL(request.url);
    const timeoutType = searchParams.get('type') || TIMEOUT_TYPES.POST_CREATION;

    // Get user info from database (including is_active)
    const { default: sql } = await import('../../../../lib/db');
    const userResult = await sql<
      {
        id: number;
        name: string;
        email: string;
        is_active: boolean;
      }[]
    >`
      SELECT id, name, email, 
             COALESCE(is_active, true) as is_active
      FROM users 
      WHERE id = ${userId}
    `;

    if (userResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult[0];

    // Check timeout status for the validated user
    const timeoutStatus = await PermissionsService.checkUserTimeout(
      userId,
      timeoutType
    );

    // Return enhanced response with user validation info
    return NextResponse.json({
      ...timeoutStatus,
      userValidated: true,
      lastValidated: new Date().toISOString(),
      userInfo: {
        id: userId,
        username: user.name,
        email: user.email,
        is_active: user.is_active
      }
    });
  } catch (error) {
    console.error('❌ Error in user timeout endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to check timeout status' },
      { status: 500 }
    );
  }
}

// Apply universal enhancements wrapper
export const GET = withUniversalEnhancements(getHandler);
