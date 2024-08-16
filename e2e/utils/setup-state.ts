export function getFakeAuthCookie() {
  return [
    {
      name: 'authjs.csrf-token',
      value: process.env.AUTHJS_CSRF_TOKEN ?? '',
      domain: '127.0.0.1',
      path: '/',
      expires: -1,
      httpOnly: true,
      secure: false,
      sameSite: 'Lax' as 'Strict' | 'Lax' | 'None'
    },
    {
      name: 'authjs.callback-url',
      value: process.env.AUTHJS_CALLBACK_URL ?? '',
      domain: '127.0.0.1',
      path: '/',
      expires: -1,
      httpOnly: true,
      secure: false,
      sameSite: 'Lax' as 'Strict' | 'Lax' | 'None'
    },
    {
      name: 'authjs.session-token',
      value: process.env.AUTHJS_SESSION_TOKEN ?? '',
      domain: '127.0.0.1',
      path: '/',
      expires: -1,
      httpOnly: true,
      secure: false,
      sameSite: 'Lax' as 'Strict' | 'Lax' | 'None'
    }
  ];
}
