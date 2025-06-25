import { NextResponse } from 'next/server';

export async function GET() {
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
