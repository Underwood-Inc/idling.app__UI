import { NextRequest, NextResponse } from 'next/server';
import { rateLimitService } from '../../../../lib/services/RateLimitService';

/**
 * GET /api/admin/rate-limit
 * Get rate limiting statistics and status
 * Authentication handled by middleware
 */
export async function GET(request: NextRequest) {
  try {
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/rate-limit
 * Reset rate limit for a specific identifier
 * Authentication handled by middleware
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const identifier = searchParams.get('identifier');
    const configType = searchParams.get('type') as any;
    
    if (!identifier) {
      return NextResponse.json(
        { error: 'Identifier parameter required' },
        { status: 400 }
      );
    }
    
    rateLimitService.resetRateLimit(identifier, configType || 'api');
    
    return NextResponse.json({
      success: true,
      message: `Rate limit reset for ${identifier}`
    });
  } catch (error) {
    console.error('Error resetting rate limit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 