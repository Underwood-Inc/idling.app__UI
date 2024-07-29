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

  console.info('isAuthenticated', isAuthenticated);
  console.info('isPublicRoute', isPublicRoute);
  // console.info('nextUrl', nextUrl);
  // console.info('req', req);

  if (isPublicRoute) {
    return;
    // return Response.redirect(new URL(DEFAULT_REDIRECT, nextUrl));
  }

  if (!isPublicRoute && isAuthenticated) {
    return;
  }

  if (!isPublicRoute && !isAuthenticated) {
    console.info('redirecting to root');
    console.info('updated nextUrl', nextUrl);

    const url = new URL(AUTH_ROUTE, nextUrl);
    url.searchParams.append('redirect', nextUrl.pathname);
    return Response.redirect(url);
  }
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};

// const t = {
//   cookies: {"authjs.csrf-token":{"name":"authjs.csrf-token","value":"1554be8d5a95d0698682417bb403add12aa55d660819b1429555a0c3b6fe9983|d8b78d9102a90e47aa0c6a21f594b1c929c5d745685540cc9d2477ddf6c734d3"},"authjs.callback-url":{"name":"authjs.callback-url","value":"http://localhost:3000/"}},
//   geo: {},
//   ip: undefined,
//   nextUrl: {
//   href: 'http://localhost:3000/coins?redirect=%2Fcoins',
//   origin: 'http://localhost:3000',
//   protocol: 'http:',
//   username: '',
//   password: '',
//   host: 'localhost:3000',
//   hostname: 'localhost',
//   port: '3000',
//   pathname: '/coins',
//   search: '?redirect=%2Fcoins',
//   searchParams: URLSearchParams {  },
//   hash: ''
// },
//   url: 'http://localhost:3000/coins',
//   bodyUsed: false,
//   cache: 'default',
//   credentials: 'same-origin',
//   destination: '',
//   headers: {
//   accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
//   accept-encoding: 'gzip, deflate, br, zstd',
//   accept-language: 'en-US,en;q=0.9,en-CA;q=0.8',
//   connection: 'keep-alive',
//   cookie: 'authjs.csrf-token=1554be8d5a95d0698682417bb403add12aa55d660819b1429555a0c3b6fe9983%7Cd8b78d9102a90e47aa0c6a21f594b1c929c5d745685540cc9d2477ddf6c734d3; authjs.callback-url=http%3A%2F%2Flocalhost%3A3000%2F',
//   host: 'localhost:3000',
//   sec-ch-ua: '"Not)A;Brand";v="99", "Microsoft Edge";v="127", "Chromium";v="127"',
//   sec-ch-ua-mobile: '?0',
//   sec-ch-ua-platform: '"Windows"',
//   sec-fetch-dest: 'document',
//   sec-fetch-mode: 'navigate',
//   sec-fetch-site: 'none',
//   sec-fetch-user: '?1',
//   upgrade-insecure-requests: '1',
//   user-agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36 Edg/127.0.0.0',
//   x-forwarded-for: '::1',
//   x-forwarded-host: 'localhost:3000',
//   x-forwarded-port: '3000',
//   x-forwarded-proto: 'http'
// },
//   integrity: '',
//   keepalive: false,
//   method: 'GET',
//   mode: 'cors',
//   redirect: 'follow',
//   referrer: 'about:client',
//   referrerPolicy: '',
//   signal: AbortSignal {
//   [Symbol(kEvents)]: SafeMap(0) {},
//   [Symbol(events.maxEventTargetListeners)]: 10,
//   [Symbol(events.maxEventTargetListenersWarned)]: false,
//   [Symbol(kHandlers)]: SafeMap(0) {},
//   [Symbol(kAborted)]: false,
//   [Symbol(kReason)]: undefined,
//   [Symbol(kOnabort)]: undefined,
//   [Symbol(realm)]: {
//   settingsObject: {
//   baseUrl: undefined,
//   origin: [Getter],
//   policyContainer: { referrerPolicy: 'strict-origin-when-cross-origin' }
// }
// }
// }
// }
