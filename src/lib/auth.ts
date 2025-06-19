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
  idleTimeoutMillis: 20000, // Align with main db config
  connectionTimeoutMillis: 10000, // Align with main db config
  port: Number(process.env.POSTGRES_PORT) || 5432,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false
});

export const nextAuth = NextAuth({
  adapter: CustomPostgresAdapter(pool),
  ...authConfig,
  session: {
    strategy: 'jwt',
    maxAge: process.env.NODE_ENV === 'test' ? 30 * 24 * 60 * 60 : 24 * 60 * 60, // 30 days for tests, 1 day for production
    updateAge: 24 * 60 * 60 // Only update session once per day
  },
  callbacks: {
    ...authConfig.callbacks,
    session: async ({ session, token }) => {
      if (token) {
        session.user = {
          ...session.user,
          // Use providerAccountId as the primary ID for consistency
          id: (token.providerAccountId || token.sub || '') as string,
          providerAccountId: token.providerAccountId as string
        };
      }
      return session;
    },
    jwt: async ({ token, user }) => {
      if (user) {
        token.providerAccountId = user.providerAccountId;
      }
      return token;
    }
  }
});

export const {
  auth,
  handlers: { GET, POST },
  signIn,
  signOut
} = nextAuth;
