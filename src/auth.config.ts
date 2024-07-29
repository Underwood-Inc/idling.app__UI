import type { NextAuthConfig } from 'next-auth';
import twitch from 'next-auth/providers/twitch';

// Notice this is only an object, not a full Auth.js instance
export default {
  session: {
    strategy: 'jwt'
  },
  providers: [twitch],
  pages: {
    error: '/',
    signIn: '/',
    signOut: '/'
  },
  callbacks: {
    authorized({ auth }) {
      const isAuthenticated = !!auth?.user;

      return isAuthenticated;
    }
  }
} satisfies NextAuthConfig;
