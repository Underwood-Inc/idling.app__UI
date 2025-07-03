import { SignJWT } from 'jose';

export async function getFakeAuthCookie() {
  const expiresIn30Days = new Date();
  expiresIn30Days.setDate(expiresIn30Days.getDate() + 30);

  // Create a fresh JWT token for testing with the current NEXTAUTH_SECRET
  const secret = new TextEncoder().encode(
    process.env.NEXTAUTH_SECRET || 'test-secret-for-playwright'
  );

  const jwt = await new SignJWT({
    name: 'underwood_testing',
    email: 'test@example.com',
    picture: 'https://static-cdn.jtvnw.net/user-default-pictures-uv/998f01ae-def8-11e9-b95c-784f43822e80-profile_image-150x150.png',
    sub: '1',
    providerAccountId: '1128964567',
    databaseId: '1',
    spacing_theme: 'cozy',
    pagination_mode: 'traditional'
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .setJti(crypto.randomUUID())
    .sign(secret);

  return [
    {
      name: 'authjs.csrf-token',
      value: crypto.randomUUID(),
      domain: '127.0.0.1',
      path: '/',
      expires: expiresIn30Days.getTime() / 1000,
      httpOnly: true,
      secure: false,
      sameSite: 'Lax' as 'Strict' | 'Lax' | 'None'
    },
    {
      name: 'authjs.callback-url',
      value: 'http://127.0.0.1:3000',
      domain: '127.0.0.1',
      path: '/',
      expires: expiresIn30Days.getTime() / 1000,
      httpOnly: true,
      secure: false,
      sameSite: 'Lax' as 'Strict' | 'Lax' | 'None'
    },
    {
      name: 'authjs.session-token',
      value: jwt,
      domain: '127.0.0.1',
      path: '/',
      expires: expiresIn30Days.getTime() / 1000,
      httpOnly: true,
      secure: false,
      sameSite: 'Lax' as 'Strict' | 'Lax' | 'None'
    }
  ];
}
