import { RateLimitResetParamsSchema } from '@lib/schemas/admin-rate-limit.schema';
import { PERMISSIONS } from '@lib/permissions/permissions';
import { requireAdminApiAccess } from '@lib/security/requireAdminApiAccess';
import { rateLimitService } from '@lib/services/RateLimitService';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * GET /api/admin/rate-limit
 * Get rate limiting statistics and status
 */
export async function GET(request: NextRequest) {
  try {
    const access = await requireAdminApiAccess(PERMISSIONS.ADMIN.ACCESS);
    if (!access.granted) {
      return access.response;
    }

    const stats = rateLimitService.getStats();

    return NextResponse.json({
      success: true,
      stats: {
        ...stats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching rate limit stats:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/rate-limit
 * Reset rate limit for a specific identifier
 */
export async function DELETE(request: NextRequest) {
  try {
    const access = await requireAdminApiAccess(PERMISSIONS.ADMIN.ACCESS);
    if (!access.granted) {
      return access.response;
    }

    const { searchParams } = new URL(request.url);
    const paramsResult = RateLimitResetParamsSchema.safeParse({
      identifier: searchParams.get('identifier'),
      type: searchParams.get('type'),
    });

    if (!paramsResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid parameters',
          details: paramsResult.error.issues
        },
        { status: 400 }
      );
    }

    const { identifier, type } = paramsResult.data;

    rateLimitService.resetRateLimit(identifier, type);

    return NextResponse.json({
      success: true,
      message: `Rate limit reset for ${identifier}`,
      identifier,
      type
    });
  } catch (error) {
    console.error('Error resetting rate limit:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
