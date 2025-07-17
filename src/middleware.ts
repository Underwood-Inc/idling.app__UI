import { NAV_PATHS, PUBLIC_ROUTES } from '@lib/routes';
import NextAuth from 'next-auth';
import { NextResponse, type NextRequest } from 'next/server';
import { authConfig } from './auth.config';

const { auth } = NextAuth(authConfig);

export default auth(async (req: NextRequest & { auth: any }) => {
  const { nextUrl, auth: session } = req;

  // Note: User existence validation is handled at the API route level
  // because middleware runs in Edge Runtime which doesn't support Node.js database clients
  // Each API route uses the validation utility for consistent security checks

  // Handle API route authentication
  if (nextUrl.pathname.startsWith('/api/')) {
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

    // Protect admin routes - CRITICAL SECURITY with real-time permission checking
    if (nextUrl.pathname.startsWith('/api/admin')) {
      if (!session) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Note: Admin permission validation is handled at the individual API route level
      // because middleware runs in Edge Runtime which doesn't support database connections
      // Each admin API route MUST implement proper permission checking using the validation utility
    }

    // Continue to API route
    return NextResponse.next();
  }

  // Handle page route authentication (existing logic)
  const isAuthenticated = !!session;
  const isPublicRoute =
    PUBLIC_ROUTES.includes(nextUrl.pathname) ||
    nextUrl.pathname.startsWith('/t/') ||
    nextUrl.pathname.startsWith('/profile/');

  // CRITICAL: Protect admin pages - require authentication
  if (nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      const url = new URL(NAV_PATHS.SIGNIN, nextUrl);
      url.searchParams.append('redirect', nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    // Note: Admin permission validation is handled in the admin layout.tsx
    // because middleware runs in Edge Runtime which doesn't support database connections
    // The layout provides server-side permission checking with proper error handling
    return NextResponse.next();
  }

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
    '/api/emojis/:path*',
    '/api/upload/:path*',
    '/admin/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ]
};
