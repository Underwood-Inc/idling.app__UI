/**
 * Legacy Alerts Stream Endpoint
 * 
 * This endpoint redirects to the new universal SSE system.
 * Maintained for backward compatibility.
 * 
 * @deprecated Use /api/sse/stream instead
 */

import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Redirect to the new universal SSE endpoint
 */
export async function GET(request: NextRequest) {
  // Redirect to the new universal SSE endpoint
  return Response.redirect(new URL('/api/sse/stream', request.url), 301);
} 