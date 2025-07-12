import { auth } from '@lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimitService } from '../services/RateLimitService';
import { getRateLimitType, getRequestIdentifier } from '../utils/requestIdentifier';
import { formatRetryAfter } from '../utils/timeFormatting';

type ApiHandler = (req: NextRequest, context?: any) => Promise<Response | NextResponse> | Response | NextResponse;

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

/**
 * Higher-order function that wraps API route handlers with rate limiting
 * Maintains identical behavior to the middleware rate limiting
 */
export function withRateLimit(handler: ApiHandler, options: { skipRateLimit?: boolean } = {}) {
  return async (req: NextRequest, context?: any) => {
    const url = new URL(req.url);
    
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
    const isDryRun = url.searchParams.get('dry-run') === 'true';
    
    const skipRateLimit = exemptPaths.some(path => url.pathname.includes(path)) || isDryRun || options.skipRateLimit;

    if (skipRateLimit) {
      const response = await handler(req, context);
      return response;
    }

    // Get session for rate limiting
    const session = await auth();

    // Get comprehensive request identifiers for flexible rate limiting
    const identifiers = getRequestIdentifier(req, session);
    const rateLimitType = getRateLimitType(url.pathname);
    const userId = session?.user?.id ? parseInt(session.user.id) : null;
    
    // Multi-layered rate limiting approach:
    // 1. Primary device-level rate limiting (allows multiple devices per household)
    const deviceRateLimitResult = await rateLimitService.checkRateLimit({
      identifier: identifiers.perDevice,
      configType: rateLimitType,
    });

    // Check if device-level request should be blocked
    if (!deviceRateLimitResult.allowed) {
      console.warn(`Device rate limit exceeded for ${identifiers.perDevice} on ${url.pathname}`, {
        penaltyLevel: deviceRateLimitResult.penaltyLevel,
        isAttack: deviceRateLimitResult.isAttack,
        retryAfter: deviceRateLimitResult.retryAfter,
        quotaType: deviceRateLimitResult.quotaType
      });

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
          endpoint: url.pathname
        });
        
        // Rate limit info will be handled by fetch interceptor
        
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
        console.warn(`User rate limit exceeded for ${identifiers.perUser} on ${url.pathname}`, {
          penaltyLevel: userRateLimitResult.penaltyLevel,
          isAttack: userRateLimitResult.isAttack,
          quotaType: userRateLimitResult.quotaType
        });
        
        // Rate limit info will be handled by fetch interceptor
        
        return createRateLimitResponse(userRateLimitResult, userRateLimitResult.isAttack);
      }
    }

    // Log suspicious activity
    if (deviceRateLimitResult.penaltyLevel >= 2) {
      console.warn(`Elevated penalty level detected`, {
        deviceIdentifier: identifiers.perDevice,
        networkIdentifier: identifiers.perNetwork,
        penaltyLevel: deviceRateLimitResult.penaltyLevel,
        endpoint: url.pathname,
        userAgent: req.headers.get('user-agent')
      });
    }

    // Call the original handler
    const response = await handler(req, context);
    
    // Add rate limit headers to successful responses
    response.headers.set('X-RateLimit-Remaining', deviceRateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(deviceRateLimitResult.resetTime).toISOString());
    
    return response;
  };
} 