import { NextRequest } from 'next/server';

/**
 * Extract client IP address from request headers
 * Handles various proxy configurations and load balancers
 */
export function getClientIP(request: NextRequest): string {
  // Check for forwarded IP from proxies/load balancers
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP if multiple are present
    return forwardedFor.split(',')[0].trim();
  }

  // Check for real IP (some proxies use this)
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }

  // Check for Cloudflare connecting IP
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }

  // Check for other common headers
  const clientIP = request.headers.get('x-client-ip');
  if (clientIP) {
    return clientIP.trim();
  }

  // Fallback to connection remote address
  const remoteAddr = request.headers.get('x-forwarded-host') || 'unknown';
  return remoteAddr;
}

/**
 * Extract user identifier from session
 */
export function getUserIdentifier(session: any): string | null {
  if (!session?.user?.id) {
    return null;
  }
  return `user:${session.user.id}`;
}

/**
 * Generate a composite identifier for rate limiting
 * Combines IP and user info when available
 */
export function getRequestIdentifier(request: NextRequest, session: any): {
  ip: string;
  user: string | null;
  composite: string;
} {
  const ip = getClientIP(request);
  const user = getUserIdentifier(session);
  
  // Create composite identifier
  const composite = user ? `${ip}:${user}` : ip;
  
  return {
    ip,
    user,
    composite
  };
}

/**
 * Determine rate limit configuration type based on endpoint
 */
export function getRateLimitType(pathname: string): 'api' | 'auth' | 'upload' | 'search' | 'admin' {
  if (pathname.startsWith('/api/auth')) {
    return 'auth';
  }
  
  if (pathname.startsWith('/api/upload')) {
    return 'upload';
  }
  
  if (pathname.startsWith('/api/admin')) {
    return 'admin';
  }
  
  // Search and filter endpoints
  if (pathname.includes('search') || 
      pathname.includes('filter') || 
      pathname.includes('submissions') ||
      pathname.includes('posts')) {
    return 'search';
  }
  
  return 'api';
} 