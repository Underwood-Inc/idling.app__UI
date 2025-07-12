import { createLogger } from '@lib/logging';
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

const logger = createLogger({
  context: {
    component: 'Auth',
    module: 'lib'
  },
  enabled: false
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
          // Use database internal ID as the primary identifier for all app operations
          id: (token.databaseId || token.sub || '') as string,
          // Keep providerAccountId for OAuth purposes only
          providerAccountId: token.providerAccountId as string,
          // Include user preferences
          spacing_theme: token.spacing_theme as 'cozy' | 'compact',
          pagination_mode: token.pagination_mode as 'traditional' | 'infinite'
        };
      }
      return session;
    },
    jwt: async ({ token, user, account }) => {
      // During sign-in, capture both database ID and provider account ID
      if (user) {
        // user.id is the database internal ID from the adapter
        token.databaseId = user.id;
        token.providerAccountId =
          user.providerAccountId || account?.providerAccountId;

        // Include user preferences in token
        token.spacing_theme = user.spacing_theme || 'cozy';
        token.pagination_mode = user.pagination_mode || 'traditional';

        // Log user creation/update
        logger.info('JWT callback - User created/found', {
          id: user.id,
          email: user.email,
          name: user.name,
          provider: account?.provider,
          spacing_theme: token.spacing_theme,
          pagination_mode: token.pagination_mode
        });
      }

      // Capture providerAccountId from account during sign-in
      if (account?.providerAccountId) {
        // Log account linking
        logger.info('JWT callback - Account linked', {
          userId: user?.id,
          provider: account.provider,
          providerAccountId: account.providerAccountId
        });
        token.providerAccountId = account.providerAccountId;
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
