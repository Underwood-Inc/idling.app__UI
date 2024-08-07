import NextAuth from 'next-auth';
import { Pool } from 'pg';
import authConfig from '../auth.config';
import CustomPostgresAdapter from './adapter';

export const {
  auth,
  handlers: { GET, POST },
  signIn,
  signOut
} = NextAuth(() => {
  const pool = new Pool({
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    port: 5432 || 443
  });

  return {
    adapter: CustomPostgresAdapter(pool),
    // server-side/database session is broken it seems. does not recognize the adapter
    ...authConfig,
    // database sessions are not functional
    // session: {
    //   strategy: 'database',
    //   maxAge: 30 * 24 * 60 * 60, // 30 days
    //   updateAge: 24 * 60 * 60 // 24 hours
    // },
    session: {
      strategy: 'jwt'
    }
  };
});
