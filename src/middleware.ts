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
    // Get request identifier for rate limiting
    const identifier = getRequestIdentifier(req, session);
    const rateLimitType = getRateLimitType(nextUrl.pathname);
    
    // Apply rate limiting based on endpoint type
    const rateLimitResult = await rateLimitService.checkRateLimit({
      identifier: identifier.composite,
      configType: rateLimitType,
      bypassDevelopment: true
    });

    // Check if request should be blocked due to rate limiting
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for ${identifier.composite} on ${nextUrl.pathname}`, {
        penaltyLevel: rateLimitResult.penaltyLevel,
        isAttack: rateLimitResult.isAttack,
        retryAfter: rateLimitResult.retryAfter,
        quotaType: rateLimitResult.quotaType
      });
      
      return createRateLimitResponse(rateLimitResult, rateLimitResult.isAttack);
    }

    // Additional strict rate limiting for authenticated endpoints
    if (session?.user?.id) {
      const userRateLimitResult = await rateLimitService.checkRateLimit({
        identifier: identifier.user!,
        configType: rateLimitType,
        bypassDevelopment: true
      });
      
      if (!userRateLimitResult.allowed) {
        console.warn(`User rate limit exceeded for ${identifier.user} on ${nextUrl.pathname}`, {
          penaltyLevel: userRateLimitResult.penaltyLevel,
          isAttack: userRateLimitResult.isAttack,
          quotaType: userRateLimitResult.quotaType
        });
        
        return createRateLimitResponse(userRateLimitResult, userRateLimitResult.isAttack);
      }
    }

    // Log suspicious activity
    if (rateLimitResult.penaltyLevel >= 2) {
      console.warn(`Elevated penalty level detected`, {
        identifier: identifier.composite,
        penaltyLevel: rateLimitResult.penaltyLevel,
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
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());
    
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
