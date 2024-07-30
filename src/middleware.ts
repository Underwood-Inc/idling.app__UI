// import NextAuth from 'next-auth';
// import authConfig from './lib/auth.config';

// export const { auth: middleware } = NextAuth(authConfig);

// // export { auth as middleware } from './src/lib/auth';
// // Read more: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
// export const config = {
//   matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
// };

import NextAuth from 'next-auth';
import authConfig from './auth.config';
import { AUTH_ROUTE, PUBLIC_ROUTES } from './lib/routes';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;

  const isAuthenticated = !!req.auth;
  const isPublicRoute = PUBLIC_ROUTES.includes(nextUrl.pathname);

  if (isPublicRoute) {
    return;
    // return Response.redirect(new URL(DEFAULT_REDIRECT, nextUrl));
  }

  if (!isPublicRoute && isAuthenticated) {
    return;
  }

  if (!isPublicRoute && !isAuthenticated) {
    const url = new URL(AUTH_ROUTE, nextUrl);
    url.searchParams.append('redirect', nextUrl.pathname);
    return Response.redirect(url);
  }
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
