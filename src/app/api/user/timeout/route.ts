/**
 * User Timeout Status API
 * Allows users to check their own timeout status
 */

import { withUniversalEnhancements } from '@lib/api/withUniversalEnhancements';
import { NextResponse } from 'next/server';
import { type ValidatedRequest } from '../../../../lib/api/withValidation';
import {
  PermissionsService,
  TIMEOUT_TYPES
} from '../../../../lib/permissions/permissions';

// This route uses dynamic features (auth/headers) and should not be pre-rendered
export const dynamic = 'force-dynamic';

// GET /api/user/timeout - Get current user's timeout status (with automatic validation)
async function getHandler(request: ValidatedRequest) {
  try {
    // User authentication and existence are already validated by withAuthValidation
    // request.user is guaranteed to exist and be validated
    const userId = request.user!.id;

    const { searchParams } = new URL(request.url);
    const timeoutType = searchParams.get('type') || TIMEOUT_TYPES.POST_CREATION;

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
        id: request.user!.id,
        name: request.user!.name,
        isActive: request.user!.is_active
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

// Export with validation wrapper
export const GET = withUniversalEnhancements(getHandler);
