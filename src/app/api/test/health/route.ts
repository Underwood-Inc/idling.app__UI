import { withUniversalEnhancementsNoRateLimit } from '@lib/api/withUniversalEnhancements';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function healthHandler() {
  return NextResponse.json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        nextjs: 'running',
        environment: process.env.NODE_ENV || 'development'
      }
    },
    { status: 200 }
  );
}

export const GET = withUniversalEnhancementsNoRateLimit(healthHandler);
