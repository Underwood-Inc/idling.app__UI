export function getFakeAuthCookie() {
  const expiresIn30Days = new Date();
  expiresIn30Days.setDate(expiresIn30Days.getDate() + 30);

  // Generate fallback values that match real NextAuth token formats
  
  // CSRF Token: Real format is hex%7Chex (hex|hex URL-encoded)
  const fallbackCsrfToken = process.env.AUTHJS_CSRF_TOKEN || 
    `${crypto.randomUUID().replace(/-/g, '')}%7C${crypto.randomUUID().replace(/-/g, '')}`;
  
  // Callback URL: Real format is URL-encoded
  const fallbackCallbackUrl = process.env.AUTHJS_CALLBACK_URL || 
    'http%3A%2F%2F127.0.0.1%3A3000%2F';
  
  // Session Token: Real format is JWE (JSON Web Encryption) - very complex
  // For fallback, we'll use a mock JWE-like structure that won't work for real auth
  // but should allow tests to run without authentication errors
  const fallbackSessionToken = process.env.AUTHJS_SESSION_TOKEN || [
    'eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwia2lkIjoidGVzdC1mYWxsYmFjay1rZXkifQ',
    'dGVzdC1mYWxsYmFjay1pdg',
    'dGVzdC1mYWxsYmFjay1wYXlsb2FkLWZvci1wbGF5d3JpZ2h0LXRlc3RpbmctZG9lcy1ub3Qtd29yay1mb3ItcmVhbC1hdXRo',
    'dGVzdC1mYWxsYmFjay10YWc'
  ].join('..');

  return [
    {
      name: 'authjs.csrf-token',
      value: fallbackCsrfToken,
      domain: '127.0.0.1',
      path: '/',
      expires: expiresIn30Days.getTime() / 1000,
      httpOnly: true,
      secure: false,
      sameSite: 'Lax' as const
    },
    {
      name: 'authjs.callback-url',
      value: fallbackCallbackUrl,
      domain: '127.0.0.1',
      path: '/',
      expires: expiresIn30Days.getTime() / 1000,
      httpOnly: true,
      secure: false,
      sameSite: 'Lax' as const
    },
    {
      name: 'authjs.session-token',
      value: fallbackSessionToken,
      domain: '127.0.0.1',
      path: '/',
      expires: expiresIn30Days.getTime() / 1000,
      httpOnly: true,
      secure: false,
      sameSite: 'Lax' as const
    }
  ];
}
