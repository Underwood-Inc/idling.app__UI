import { NAV_PATHS, PUBLIC_ROUTES } from '@lib/routes';
import { getSecureCacheBustingHeaders } from '@lib/security/secure-logout';
import NextAuth from 'next-auth';
import { NextResponse, type NextRequest } from 'next/server';
import { authConfig } from './auth.config';

const { auth } = NextAuth(authConfig);

export default auth(async (req: NextRequest & { auth: any }) => {
  const { nextUrl, auth: session } = req;

  // Handle API route authentication
  if (nextUrl.pathname.startsWith('/api/')) {
    // Skip auth routes (they handle their own auth)
    if (nextUrl.pathname.startsWith('/api/auth/')) {
      return NextResponse.next();
    }

    // Public API routes that don't require authentication
    const publicApiRoutes = [
      '/api/health',
      '/api/status',
      '/api/version', // Public app version info
      '/api/og-image',
      '/api/user-subscriptions', // Public profile data for guest users
      '/api/test/', // Test and health check endpoints
      '/api/monitoring/',
      '/api/ping',
      '/api/ready',
      '/api/live'
    ];

    const isPublicApiRoute = publicApiRoutes.some((route) =>
      nextUrl.pathname.startsWith(route)
    );

    // Debug logging for route classification
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console -- Development debugging
      console.log(
        `🔍 MIDDLEWARE: ${nextUrl.pathname} - Public: ${isPublicApiRoute}`
      );
    }

    if (!isPublicApiRoute) {
      // For Edge Runtime compatibility, only do basic auth checks in middleware
      // Full database validation will happen in the actual API routes

      if (!session) {
        const response = NextResponse.json(
          {
            error: 'Authentication required',
            code: 'AUTH_REQUIRED',
            requiresReauth: true
          },
          { status: 401 }
        );

        // Add cache-busting headers for security
        const secureHeaders = getSecureCacheBustingHeaders();
        Object.entries(secureHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });

        return response;
      }

      // Add security headers to successful API responses
      const response = NextResponse.next();
      const secureHeaders = getSecureCacheBustingHeaders();
      Object.entries(secureHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      // Add additional headers for admin routes
      if (nextUrl.pathname.startsWith('/api/admin')) {
        response.headers.set('X-Admin-Route', 'true');
        response.headers.set('X-Security-Level', 'high');
        response.headers.set('X-Requires-Admin', 'true');
      }

      return response;
    }

    // Continue to API route for public routes
    return NextResponse.next();
  }

  // Handle page route authentication with universal security checking
  const isPublicRoute =
    PUBLIC_ROUTES.includes(nextUrl.pathname) ||
    nextUrl.pathname.startsWith('/t/') ||
    nextUrl.pathname.startsWith('/profile/') ||
    nextUrl.pathname.startsWith('/auth/');

  // Allow public routes without security checking
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // CRITICAL: Enhanced security for admin pages - Edge Runtime compatible
  if (nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      const url = new URL(NAV_PATHS.SIGNIN, nextUrl);
      url.searchParams.append('redirect', nextUrl.pathname);
      url.searchParams.append('reason', 'admin_auth_required');

      const response = NextResponse.redirect(url);

      // Add cache-busting headers to admin redirects
      const secureHeaders = getSecureCacheBustingHeaders();
      Object.entries(secureHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      response.headers.set('X-Admin-Redirect', 'true');
      response.headers.set('X-Security-Failure', 'AUTH_REQUIRED');

      return response;
    }

    // For authenticated admin access, add cache-busting headers
    // Admin permission validation will happen in the layout.tsx with database access
    const response = NextResponse.next();
    const secureHeaders = getSecureCacheBustingHeaders();
    Object.entries(secureHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    response.headers.set('X-Admin-Page', 'true');
    response.headers.set('X-Security-Level', 'maximum');
    response.headers.set('X-Requires-Admin-Check', 'true');

    return response;
  }

  // For all other protected routes, perform basic auth check
  // Full validation will happen in server components with database access
  if (!session) {
    const url = new URL(NAV_PATHS.SIGNIN, nextUrl);
    url.searchParams.append('redirect', nextUrl.pathname);
    url.searchParams.append('reason', 'auth_required');

    const response = NextResponse.redirect(url);

    // Add security headers to redirects
    const secureHeaders = getSecureCacheBustingHeaders();
    Object.entries(secureHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    response.headers.set('X-Security-Redirect', 'true');
    response.headers.set('X-Security-Failure', 'AUTH_REQUIRED');

    return response;
  }

  // Basic auth passed - allow access with security headers
  // Server components will do full database validation
  const response = NextResponse.next();
  const secureHeaders = getSecureCacheBustingHeaders();
  Object.entries(secureHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  response.headers.set('X-Security-Basic-Validated', 'true');

  return response;
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    {
      source:
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|txt|xml|ico)$).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' }
      ]
    }
  ]
};
