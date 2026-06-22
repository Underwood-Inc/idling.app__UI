// Vitest environment bootstrap — runs before vitest.setup.ts
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.NEXTAUTH_SECRET = 'test-secret-for-vitest';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.VERCEL_URL = undefined;
process.env.VERCEL_ENV = undefined;
