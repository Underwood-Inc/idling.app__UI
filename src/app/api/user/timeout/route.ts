/**
 * User Timeout Status API
 * Allows users to check their own timeout status
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../lib/auth';
import {
  PermissionsService,
  TIMEOUT_TYPES
} from '../../../../lib/permissions/permissions';

// GET /api/user/timeout - Get current user's timeout status
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeoutType = searchParams.get('type') || TIMEOUT_TYPES.POST_CREATION;

    // Check timeout status for the current user
    const timeoutStatus = await PermissionsService.checkUserTimeout(
      parseInt(session.user.id),
      timeoutType
    );

    return NextResponse.json(timeoutStatus);
  } catch (error) {
    console.error('Error checking user timeout status:', error);
    return NextResponse.json(
      { error: 'Failed to check timeout status' },
      { status: 500 }
    );
  }
}
