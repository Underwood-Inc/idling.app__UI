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
 * Generate a device fingerprint based on request headers
 * This helps distinguish different devices on the same network
 * Uses a simple hash instead of crypto for edge runtime compatibility
 */
export function generateDeviceFingerprint(request: NextRequest): string {
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const acceptLanguage = request.headers.get('accept-language') || 'unknown';
  const acceptEncoding = request.headers.get('accept-encoding') || 'unknown';
  const accept = request.headers.get('accept') || 'unknown';
  
  // Create a stable but unique fingerprint
  const fingerprintData = [
    userAgent.substring(0, 200), // Limit length but keep core info
    acceptLanguage.split(',')[0], // Primary language
    acceptEncoding.split(',').slice(0, 3).join(','), // First few encoding types
    accept.split(',')[0] // Primary accept type
  ].join('|');
  
  // Use a simple hash for edge runtime compatibility
  return simpleHash(fingerprintData).substring(0, 8);
}

/**
 * Simple hash function that works in edge runtime
 * This is a basic djb2 hash implementation
 */
function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return Math.abs(hash).toString(16);
}

/**
 * Generate network identifier (subnet-based) for household grouping
 * This allows some shared limits while maintaining device separation
 */
export function getNetworkIdentifier(ip: string): string {
  if (ip === 'unknown') return 'unknown';
  
  const parts = ip.split('.');
  if (parts.length !== 4) return ip;
  
  // For most home networks, use /24 subnet (first 3 octets)
  // This groups household devices while separating different networks
  return `${parts[0]}.${parts[1]}.${parts[2]}.x`;
}

export interface RequestIdentifiers {
  ip: string;
  user: string | null;
  deviceFingerprint: string;
  networkId: string;
  composite: string;
  // Different identifiers for different rate limiting strategies
  perDevice: string;      // Most granular - per device
  perUser: string;        // Per authenticated user
  perNetwork: string;     // Per household/network
  perIP: string;          // Per exact IP (most restrictive)
}

/**
 * Generate comprehensive request identifiers for flexible rate limiting
 * This allows different rate limiting strategies based on the threat level
 */
export function getRequestIdentifier(request: NextRequest, session: any): RequestIdentifiers {
  const ip = getClientIP(request);
  const user = getUserIdentifier(session);
  const deviceFingerprint = generateDeviceFingerprint(request);
  const networkId = getNetworkIdentifier(ip);
  
  // Create different identifier strategies
  const perDevice = `device:${networkId}:${deviceFingerprint}`;
  const perUser = user || perDevice; // Fall back to device if no user
  const perNetwork = `network:${networkId}`;
  const perIP = `ip:${ip}`;
  
  // Default composite uses device-level identification for unauthenticated users
  // This allows multiple devices per household while blocking device-specific abuse
  const composite = user ? `${perDevice}:${user}` : perDevice;
  
  return {
    ip,
    user,
    deviceFingerprint,
    networkId,
    composite,
    perDevice,
    perUser,
    perNetwork,
    perIP
  };
}

/**
 * Determine rate limit configuration type based on endpoint
 */
export function getRateLimitType(pathname: string): 'api' | 'auth' | 'upload' | 'search' | 'admin' | 'og-image' | 'sse' {
  if (pathname.startsWith('/api/auth')) {
    return 'auth';
  }
  
  if (pathname.startsWith('/api/upload')) {
    return 'upload';
  }
  
  if (pathname.startsWith('/api/admin')) {
    return 'admin';
  }
  
  // SSE endpoints need very lenient rate limiting due to persistent connections
  if (pathname.includes('/stream') || 
      pathname.startsWith('/api/sse') || 
      pathname.startsWith('/api/alerts/stream')) {
    return 'sse';
  }
  
  // OG Image generation endpoints - more generous limits
  if (pathname.startsWith('/api/og-image')) {
    return 'og-image';
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