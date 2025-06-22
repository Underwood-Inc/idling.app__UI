import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    // Skip middleware for static files and API routes that don't need auth
    if (
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/api/auth/') ||
      pathname.includes('.') ||
      pathname === '/favicon.ico'
    ) {
      return NextResponse.next();
    }

    // Handle API route authentication
    if (pathname.startsWith('/api/')) {
      // Get session from cookies (simplified check)
      const sessionToken =
        request.cookies.get('next-auth.session-token') ||
        request.cookies.get('__Secure-next-auth.session-token');

      // Protect profile update routes (PATCH, POST, DELETE)
      if (pathname.startsWith('/api/profile') && request.method !== 'GET') {
        if (!sessionToken) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }
      }

      // Protect admin routes
      if (pathname.startsWith('/api/admin')) {
        if (!sessionToken) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }
      }

      // Allow other API routes to continue
      return NextResponse.next();
    }

    // Handle page route authentication
    const sessionToken =
      request.cookies.get('next-auth.session-token') ||
      request.cookies.get('__Secure-next-auth.session-token');
    const isAuthenticated = !!sessionToken;

    // Define public routes
    const publicRoutes = ['/', '/auth/signin'];
    const isPublicRoute =
      publicRoutes.includes(pathname) ||
      pathname.startsWith('/t/') ||
      pathname.startsWith('/profile/');

    if (isPublicRoute) {
      return NextResponse.next();
    }

    if (!isPublicRoute && isAuthenticated) {
      return NextResponse.next();
    }

    if (!isPublicRoute && !isAuthenticated) {
      const url = new URL('/auth/signin', request.url);
      url.searchParams.append('redirect', pathname);
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    // In case of error, allow the request to continue
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/api/profile/:path*',
    '/api/admin/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ]
};
