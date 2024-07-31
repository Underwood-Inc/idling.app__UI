import type { NextAuthConfig, Session } from 'next-auth';
import google from 'next-auth/providers/google';
import twitch from 'next-auth/providers/twitch';

export type CustomSession = Session & {
  user: Session['user'] & { providerAccountId?: string };
};

// Notice this is only an object, not a full Auth.js instance
export default {
  providers: [
    twitch({
      clientId: process.env.AUTH_TWITCH_ID,
      clientSecret: process.env.AUTH_TWITCH_SECRET
    }),
    google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    })
  ],
  pages: {
    error: '/',
    signIn: '/auth/signin',
    signOut: '/'
  },
  callbacks: {
    authorized({ auth }) {
      const isAuthenticated = !!auth?.user;

      return isAuthenticated;
    },
    signIn({ account, user }) {
      //providerAccountId
      if (account?.providerAccountId) {
        // @ts-expect-error intentionally adding this info for future reference
        user.providerAccountId = account.providerAccountId;
      }

      if (account?.userId && !user.id) {
        user.id = account?.userId;
      }

      return true;
    },
    async jwt({ token, account, user }) {
      if (account) {
        if (account?.userId && !user.id) {
          user.id = account?.userId;
        }

        token.providerAccountId = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        // @ts-expect-error intentionally adding this to the auth token for future reference
        session.user.providerAccountId = token.providerAccountId;
      }

      return session;
    }
  }
} satisfies NextAuthConfig;
