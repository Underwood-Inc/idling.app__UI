import NextAuth from 'next-auth';
import { Pool } from 'pg';
import { authConfig } from '../auth.config';
import CustomPostgresAdapter from './adapter';

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  port: Number(process.env.POSTGRES_PORT) || 5432
});

export const nextAuth = NextAuth({
  adapter: CustomPostgresAdapter(pool),
  ...authConfig,
  session: {
    strategy: 'jwt',
    maxAge: process.env.NODE_ENV === 'test' ? 30 * 24 * 60 * 60 : 24 * 60 * 60 // 30 days for tests, 1 day for production
  }
});

export const {
  auth,
  handlers: { GET, POST },
  signIn,
  signOut
} = nextAuth;
