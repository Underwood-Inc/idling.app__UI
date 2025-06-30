import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/test-rate-limit
 * Test rate limit notification system (SSE removed)
 * Development only - now simulates rate limit via response headers
 */
export async function POST(request: NextRequest) {
  // Only available in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Test endpoints only available in development' },
      { status: 403 }
    );
  }

  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();
    const { testType = 'normal', targetUserId } = body;

    // Use target user ID if provided (for testing), otherwise use current user
    const testUserId = targetUserId ? parseInt(targetUserId) : userId;

    console.log(`🧪 Testing rate limit notification for user ${testUserId} (type: ${testType})`);

    // Simulate rate limit by returning a 429 response with rate limit headers
    // This will trigger the fetch interceptor to store rate limit info in sessionStorage
    const isAttack = testType === 'attack';
    const retryAfter = isAttack ? 300 : 60; // 5 minutes for attack, 1 minute for normal
    
    const message = isAttack 
      ? 'Suspicious activity detected. Access temporarily restricted.'
      : 'Rate limit exceeded for testing purposes.';

    const response = NextResponse.json(
      { 
        error: message,
        retryAfter,
        penaltyLevel: isAttack ? 3 : 1,
        quotaType: 'test'
      },
      { status: 429 }
    );

    // Add rate limit headers that the fetch interceptor will read
    response.headers.set('X-RateLimit-Limit', '100');
    response.headers.set('X-RateLimit-Remaining', '0');
    response.headers.set('X-RateLimit-Reset', new Date(Date.now() + retryAfter * 1000).toISOString());
    response.headers.set('Retry-After', retryAfter.toString());
    
    if (isAttack) {
      response.headers.set('X-Security-Warning', 'Rate limit test - attack simulation');
    }

    return response;

  } catch (error) {
    console.error('Rate limit test error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 