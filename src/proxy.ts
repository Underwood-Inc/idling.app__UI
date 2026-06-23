import {
  IDLING_RADIO_PWA_SHELL_HEADER,
  IDLING_RADIO_PWA_START_PATH,
  isPublicApiPath,
  isPublicInfraPath,
  isPublicPagePath,
  NAV_PATHS,
} from '@lib/routes';
import { getSecureCacheBustingHeaders } from '@lib/security/secure-logout';
import NextAuth from 'next-auth';
import { NextResponse, type NextRequest } from 'next/server';
import { authConfig } from './auth.config';

const { auth } = NextAuth(authConfig);

export default auth(async (req: NextRequest & { auth: any }) => {
  const { nextUrl, auth: session } = req;

  if (isPublicInfraPath(nextUrl.pathname)) {
    return NextResponse.next();
  }

  // Handle API route authentication
  if (nextUrl.pathname.startsWith('/api/')) {
    // Skip auth routes (they handle their own auth)
    if (nextUrl.pathname.startsWith('/api/auth/')) {
      return NextResponse.next();
    }

    const isPublicApiRoute = isPublicApiPath(nextUrl.pathname);

    // Debug logging for route classification
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console -- Development debugging
      console.log(
        `🔍 PROXY: ${nextUrl.pathname} - Public: ${isPublicApiRoute}`
      );
    }

    if (!isPublicApiRoute) {
      // For Edge Runtime compatibility, only do basic auth checks in proxy
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

  if (nextUrl.pathname === IDLING_RADIO_PWA_START_PATH) {
    const response = NextResponse.next();
    response.headers.set(IDLING_RADIO_PWA_SHELL_HEADER, '1');
    return response;
  }

  // Handle page route authentication with universal security checking
  if (isPublicPagePath(nextUrl.pathname)) {
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
        '/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.json|idling-radio\\.webmanifest|offline\\.html|ads\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|txt|xml|ico|woff|woff2|ttf|otf|eot)$).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' }
      ]
    }
  ]
};
