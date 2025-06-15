export function getFakeAuthCookie() {
  const expiresIn24Hours = new Date();
  expiresIn24Hours.setHours(expiresIn24Hours.getHours() + 24);

  return [
    {
      name: 'authjs.csrf-token',
      value: process.env.AUTHJS_CSRF_TOKEN ?? '',
      domain: '127.0.0.1',
      path: '/',
      expires: expiresIn24Hours.getTime() / 1000,
      httpOnly: true,
      secure: false,
      sameSite: 'Lax' as 'Strict' | 'Lax' | 'None'
    },
    {
      name: 'authjs.callback-url',
      value: process.env.AUTHJS_CALLBACK_URL ?? '',
      domain: '127.0.0.1',
      path: '/',
      expires: expiresIn24Hours.getTime() / 1000,
      httpOnly: true,
      secure: false,
      sameSite: 'Lax' as 'Strict' | 'Lax' | 'None'
    },
    {
      name: 'authjs.session-token',
      value: process.env.AUTHJS_SESSION_TOKEN ?? '',
      domain: '127.0.0.1',
      path: '/',
      expires: expiresIn24Hours.getTime() / 1000,
      httpOnly: true,
      secure: false,
      sameSite: 'Lax' as 'Strict' | 'Lax' | 'None'
    }
  ];
}
