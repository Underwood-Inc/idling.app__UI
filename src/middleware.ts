import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from './auth.config';
import { NAV_PATHS, PUBLIC_ROUTES } from './lib/routes';

const { auth } = NextAuth({
  ...authConfig,
  basePath: '/api/auth'
});

export default auth((req) => {
  const { nextUrl } = req;

  const isAuthenticated = !!req.auth;
  const isPublicRoute =
    PUBLIC_ROUTES.includes(nextUrl.pathname) ||
    nextUrl.pathname.startsWith('/t/');

  if (isPublicRoute) {
    return;
    // return Response.redirect(new URL(DEFAULT_REDIRECT, nextUrl));
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
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
