import type { NextAuthConfig, Session } from 'next-auth';
import { User } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import google from 'next-auth/providers/google';
import twitch from 'next-auth/providers/twitch';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      providerAccountId?: string;
    };
  }

  interface User {
    providerAccountId?: string;
  }

  interface JWT {
    providerAccountId?: string;
  }
}

export type CustomSession = Session;

export interface UserWithProviderAccountId extends User {
  providerAccountId?: string;
}

export interface JWTWithProviderAccountId extends JWT {
  providerAccountId?: string;
}

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
    async redirect({ url, baseUrl }) {
      // Handle custom redirects
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // Handle callback URLs with redirect parameter
      if (url.startsWith(baseUrl)) {
        const urlObj = new URL(url);
        const redirectParam = urlObj.searchParams.get('redirect');
        if (redirectParam && redirectParam.startsWith('/')) {
          return `${baseUrl}${redirectParam}`;
        }
        return url;
      }
      return baseUrl;
    },
    async signIn({ account, user }) {
      if (account?.providerAccountId) {
        (user as UserWithProviderAccountId).providerAccountId =
          account.providerAccountId;
      }
      return true;
    },
    async jwt({ token, account, user }) {
      // Simple JWT callback - just store providerAccountId from account or user
      if (account?.providerAccountId) {
        (token as JWTWithProviderAccountId).providerAccountId =
          account.providerAccountId;
      } else if (user?.providerAccountId) {
        (token as JWTWithProviderAccountId).providerAccountId =
          user.providerAccountId;
      }

      return token;
    },
    async session({ session, token }) {
      // Use providerAccountId as the primary ID for consistency
      if (token.providerAccountId) {
        session.user.id = token.providerAccountId as string;
        session.user.providerAccountId = token.providerAccountId as string;
      }

      return session;
    }
  },
  session: {
    strategy: 'jwt',
    maxAge:
      process.env.NODE_ENV === 'development' ? 30 * 24 * 60 * 60 : 24 * 60 * 60 // 30 days in dev, 1 day in prod
  },
  secret: process.env.NEXTAUTH_SECRET
} satisfies NextAuthConfig;
