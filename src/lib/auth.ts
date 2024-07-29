import NextAuth from 'next-auth';
import { Pool } from 'pg';
// import { Pool } from '@neondatabase/serverless';
// import PostgresAdapter from './adapter';
// const { Client } = require('pg');
import PostgresAdapter from '@auth/pg-adapter';
import authConfig from '../auth.config';

interface User {
  id: string;
  username: string;
  email: string;
  twitch_id: string;
  created_date: string;
}

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
    adapter: PostgresAdapter(pool),
    ...authConfig
  };
});
