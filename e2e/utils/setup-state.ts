import { SignJWT } from 'jose';

export async function getFakeAuthCookie() {
  const expiresIn30Days = new Date();
  expiresIn30Days.setDate(expiresIn30Days.getDate() + 30);

  // Use the same secret that NextAuth uses in production
  const secret = new TextEncoder().encode(
    process.env.NEXTAUTH_SECRET || 'test-secret-for-playwright-fallback'
  );

  // Create a JWT token that exactly matches NextAuth's internal format
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (30 * 24 * 60 * 60); // 30 days from now (matching the test session maxAge)

  const jwt = await new SignJWT({
    // NextAuth.js standard JWT claims (based on auth.config.ts)
    sub: '1', // User ID - this is what NextAuth uses internally
    name: 'underwood_testing',
    email: 'test@example.com',
    picture: 'https://static-cdn.jtvnw.net/user-default-pictures-uv/998f01ae-def8-11e9-b95c-784f43822e80-profile_image-150x150.png',
    
    // Custom claims that match the JWT callback in auth.config.ts
    databaseId: '1', // This is what gets stored in the JWT callback
    providerAccountId: '1128964567',
    spacing_theme: 'cozy',
    pagination_mode: 'traditional',
    
    // Standard JWT claims
    iat: now,
    exp: exp,
    jti: crypto.randomUUID()
  })
    .setProtectedHeader({ alg: 'HS256' })
    .sign(secret);

  // Generate proper CSRF token (simple UUID is fine for testing)
  const csrfToken = crypto.randomUUID();

  return [
    {
      name: 'authjs.csrf-token',
      value: csrfToken,
      domain: '127.0.0.1',
      path: '/',
      expires: expiresIn30Days.getTime() / 1000,
      httpOnly: true,
      secure: false,
      sameSite: 'Lax'
    },
    {
      name: 'authjs.callback-url',
      value: 'http://127.0.0.1:3000',
      domain: '127.0.0.1',
      path: '/',
      expires: expiresIn30Days.getTime() / 1000,
      httpOnly: true,
      secure: false,
      sameSite: 'Lax'
    },
    {
      name: 'authjs.session-token',
      value: jwt,
      domain: '127.0.0.1',
      path: '/',
      expires: expiresIn30Days.getTime() / 1000,
      httpOnly: true,
      secure: false,
      sameSite: 'Lax'
    }
  ];
}
