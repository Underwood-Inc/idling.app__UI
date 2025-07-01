import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from './auth.config';
import { NAV_PATHS, PUBLIC_ROUTES } from './lib/routes';
import { rateLimitService } from './lib/services/RateLimitService';
import { getRateLimitType, getRequestIdentifier } from './lib/utils/requestIdentifier';
import { formatRetryAfter } from './lib/utils/timeFormatting';

const { auth } = NextAuth({
  ...authConfig,
  basePath: '/api/auth'
});

/**
 * Send rate limit notification (SSE removed, now relies on sessionStorage)
 */
async function sendRateLimitNotification(
  userId: number | null,
  rateLimitResult: any,
  isAttack: boolean = false,
  endpoint: string
) {
  // SSE notifications removed - SimpleBannerSystem now uses polling
  // Rate limit info is automatically stored in sessionStorage by the fetch interceptor
  // No additional action needed here
}

/**
 * Create rate limit response with appropriate headers
 */
function createRateLimitResponse(result: any, isAttack: boolean = false) {
  const status = isAttack ? 429 : 429; // Too Many Requests
  
  // Create human-readable error message
  let message = 'Too many requests. Please slow down.';
  if (result.retryAfter) {
    const humanTime = formatRetryAfter(result.retryAfter);
    message = isAttack 
      ? `Suspicious activity detected. Access temporarily restricted. Try again in ${humanTime}.`
      : `Rate limit exceeded. Please try again in ${humanTime}.`;
  }

  const response = NextResponse.json(
    { 
      error: message,
      retryAfter: result.retryAfter,
      retryAfterHuman: result.retryAfter ? formatRetryAfter(result.retryAfter) : undefined,
      penaltyLevel: result.penaltyLevel,
      quotaType: result.quotaType
    },
    { status }
  );

  // Add standard rate limit headers
  response.headers.set('X-RateLimit-Limit', '100'); // Will be dynamic in production
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
  
  if (result.retryAfter) {
    response.headers.set('Retry-After', result.retryAfter.toString());
  }

  // Add security headers for attacks
  if (isAttack) {
    response.headers.set('X-Security-Warning', 'Rate limit violation detected');
  }

  return response;
}

export default auth(async (req) => {
  const { nextUrl, auth: session } = req;

  // Handle API route rate limiting and authentication
  if (nextUrl.pathname.startsWith('/api/')) {
    // Skip rate limiting for certain endpoints
    enum RateLimitExemptPaths {
      AUTH_SESSION = '/api/auth/session',
      ALERTS_ACTIVE = '/api/alerts/active',
      USER_TIMEOUT = '/api/user/timeout',
      ADMIN_ALERTS = '/api/admin/alerts',
      NEXT_INTERNAL = '/_next/',
      VERSION = '/api/version',
      LINK_PREVIEW = '/api/link-preview',
      TEST_HEALTH = '/api/test/health',
      NOTIFICATIONS_POLL = '/api/notifications/poll',
      BUDDHA_API = 'https://buddha-api.com/api/random'
    }

    const exemptPaths = Object.values(RateLimitExemptPaths);
    const isDryRun = nextUrl.searchParams.get('dry-run') === 'true';
    
    const skipRateLimit = exemptPaths.some(path => nextUrl.pathname.includes(path)) || isDryRun;

    if (skipRateLimit) {
      return NextResponse.next();
    }

    // Get comprehensive request identifiers for flexible rate limiting
    const identifiers = getRequestIdentifier(req, session);
    const rateLimitType = getRateLimitType(nextUrl.pathname);
    const userId = session?.user?.id ? parseInt(session.user.id) : null;
    
    // Multi-layered rate limiting approach:
    // 1. Primary device-level rate limiting (allows multiple devices per household)
    const deviceRateLimitResult = await rateLimitService.checkRateLimit({
      identifier: identifiers.perDevice,
      configType: rateLimitType,
    });

    // Check if device-level request should be blocked
    if (!deviceRateLimitResult.allowed) {
      console.warn(`Device rate limit exceeded for ${identifiers.perDevice} on ${nextUrl.pathname}`, {
        penaltyLevel: deviceRateLimitResult.penaltyLevel,
        isAttack: deviceRateLimitResult.isAttack,
        retryAfter: deviceRateLimitResult.retryAfter,
        quotaType: deviceRateLimitResult.quotaType
      });
      
      // Send real-time notification via SSE
      await sendRateLimitNotification(
        userId,
        deviceRateLimitResult,
        deviceRateLimitResult.isAttack,
        nextUrl.pathname
      );
      
      return createRateLimitResponse(deviceRateLimitResult, deviceRateLimitResult.isAttack);
    }

    // 2. Network-level rate limiting (household-wide protection against severe abuse)
    // Only apply network-level limits if device shows suspicious behavior
    if (deviceRateLimitResult.penaltyLevel >= 2) {
      const networkRateLimitResult = await rateLimitService.checkRateLimit({
        identifier: identifiers.perNetwork,
        configType: rateLimitType,
        customConfig: {
          windowMs: 60 * 1000, // 1 minute
          maxRequests: 500,    // Much higher limit for network-wide
          storage: 'memory' as const,
          keyPrefix: 'network'
        },
      });

      if (!networkRateLimitResult.allowed) {
        console.warn(`Network rate limit exceeded for ${identifiers.perNetwork} due to suspicious device activity`, {
          devicePenalty: deviceRateLimitResult.penaltyLevel,
          networkPenalty: networkRateLimitResult.penaltyLevel,
          endpoint: nextUrl.pathname
        });
        
        // Send real-time security alert via SSE
        await sendRateLimitNotification(
          userId,
          networkRateLimitResult,
          true, // Always mark network-level blocks as attacks
          nextUrl.pathname
        );
        
        return createRateLimitResponse(networkRateLimitResult, true); // Mark as attack
      }
    }

    // 3. User-specific rate limiting for authenticated requests
    if (session?.user?.id) {
      const userRateLimitResult = await rateLimitService.checkRateLimit({
        identifier: identifiers.perUser,
        configType: rateLimitType,
      });
      
      if (!userRateLimitResult.allowed) {
        console.warn(`User rate limit exceeded for ${identifiers.perUser} on ${nextUrl.pathname}`, {
          penaltyLevel: userRateLimitResult.penaltyLevel,
          isAttack: userRateLimitResult.isAttack,
          quotaType: userRateLimitResult.quotaType
        });
        
        // Send real-time notification via SSE
        await sendRateLimitNotification(
          userId,
          userRateLimitResult,
          userRateLimitResult.isAttack,
          nextUrl.pathname
        );
        
        return createRateLimitResponse(userRateLimitResult, userRateLimitResult.isAttack);
      }
    }

    // Log suspicious activity
    if (deviceRateLimitResult.penaltyLevel >= 2) {
      console.warn(`Elevated penalty level detected`, {
        deviceIdentifier: identifiers.perDevice,
        networkIdentifier: identifiers.perNetwork,
        penaltyLevel: deviceRateLimitResult.penaltyLevel,
        endpoint: nextUrl.pathname,
        userAgent: req.headers.get('user-agent')
      });
    }

    // Protect profile update routes (PATCH, POST, DELETE)
    if (nextUrl.pathname.startsWith('/api/profile') && req.method !== 'GET') {
      if (!session) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    }

    // Protect emoji usage tracking and modification routes
    if (nextUrl.pathname.startsWith('/api/emojis') && req.method !== 'GET') {
      if (!session) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    }

    // Protect upload routes
    if (nextUrl.pathname.startsWith('/api/upload') && req.method !== 'GET') {
      if (!session) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    }

    // Note: Profile privacy protection is handled at the endpoint level
    // using the privacy utility in /lib/utils/privacy.ts for better performance
    // and to avoid database queries in middleware

    // Protect admin routes
    if (nextUrl.pathname.startsWith('/api/admin')) {
      if (!session) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    }

    // Add rate limit headers to successful responses
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Remaining', deviceRateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(deviceRateLimitResult.resetTime).toISOString());
    
    return response;
  }

  // Handle page route authentication (existing logic)
  const isAuthenticated = !!session;
  const isPublicRoute =
    PUBLIC_ROUTES.includes(nextUrl.pathname) ||
    nextUrl.pathname.startsWith('/t/') ||
    nextUrl.pathname.startsWith('/profile/');

  if (isPublicRoute) {
    return;
  }

  if (!isPublicRoute && isAuthenticated) {
    return;
  }

  if (!isPublicRoute && !isAuthenticated) {
    const url = new URL(NAV_PATHS.SIGNIN, nextUrl);
    url.searchParams.append('redirect', nextUrl.pathname);
    return NextResponse.redirect(url);
  }
});

export const config = {
  matcher: [
    '/api/profile/:path*',
    '/api/admin/:path*',
    '/api/:path*', // Add all API routes for rate limiting
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ]
};
