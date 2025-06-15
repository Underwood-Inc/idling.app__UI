import type { NextAuthConfig, Session } from 'next-auth';
import google from 'next-auth/providers/google';
import twitch from 'next-auth/providers/twitch';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    user: {
      id?: string;
      name?: string | null;
      image?: string | null;
    };
  }
}

export type CustomSession = Session & {
  user: Session['user'] & { providerAccountId?: string };
};

// Notice this is only an object, not a full Auth.js instance
export const authConfig: NextAuthConfig = {
  providers: [
    twitch({
      clientId: process.env.AUTH_TWITCH_ID!,
      clientSecret: process.env.AUTH_TWITCH_SECRET!
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
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.accessToken = account.access_token as string;
        token.id = profile.sub as string;
        token.name = profile.preferred_username as string;
        token.picture = profile.picture as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
        session.accessToken = token.accessToken as string;
      }
      return session;
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: process.env.NODE_ENV === 'test' ? 30 * 24 * 60 * 60 : 24 * 60 * 60 // 30 days for tests, 1 day for production
  },
  secret: process.env.NEXTAUTH_SECRET
} satisfies NextAuthConfig;
