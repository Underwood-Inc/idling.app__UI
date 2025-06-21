import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from './auth.config';
import { NAV_PATHS, PUBLIC_ROUTES } from './lib/routes';

const { auth } = NextAuth({
  ...authConfig,
  basePath: '/api/auth'
});

export default auth((req) => {
  const { nextUrl, auth: session } = req;

  // Admin routes are protected by the requireAdmin() check in the page component

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

    // Protect admin routes
    if (nextUrl.pathname.startsWith('/api/admin')) {
      if (!session) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    }

    // Allow other API routes to continue
    return NextResponse.next();
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
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ]
};
