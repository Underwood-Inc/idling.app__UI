import NextAuth from 'next-auth';
import twitch from 'next-auth/providers/twitch';
import { Pool } from 'pg';
// import { Pool } from '@neondatabase/serverless';
import PostgresAdapter from './adapter';
// const { Client } = require('pg');

interface User {
  id: string;
  username: string;
  email: string;
  twitch_id: string;
  created_date: string;
}

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

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [twitch],
  adapter: PostgresAdapter()
  // callbacks: {
  //   async signIn({ user, account, profile, email, credentials }) {
  //     // breaks here, try adapter
  //     // https://www.jakobmaier.at/posts/next-auth-postgres-adapter/
  //     // let sql = postgres(process.env.PGSQL_HOST!, {
  //     //   ssl: 'allow'
  //     // });
  //     const isAllowedToSignIn = true;

  //     if (isAllowedToSignIn) {
  //       // const { email, id, image, name } = user;

  //       // if (!email || !id || !name) {
  //       //   return false;
  //       // }

  //       // const users = await sql`select * from user where twitch_id = id`;

  //       // if (users.length) {
  //       //   const user = users[0] as User;
  //       //   console.log('user', user);
  //       // } else {
  //       //   // first time signin, create user in db
  //       //   const result =
  //       //     await sql`insert into users (username, email, twitch_id) values(${name}, ${email}, ${id})`;

  //       //   console.log('result', result);
  //       // }
  //       return true;
  //     } else {
  //       // Return false to display a default error message
  //       return false;
  //       // Or you can return a URL to redirect to:
  //       // return '/unauthorized'
  //     }
  //   }
  // }
});
