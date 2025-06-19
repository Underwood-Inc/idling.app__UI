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
      if (account?.providerAccountId) {
        (token as JWTWithProviderAccountId).providerAccountId =
          account.providerAccountId;
      } else if (user?.providerAccountId) {
        (token as JWTWithProviderAccountId).providerAccountId =
          user.providerAccountId;
      } else if (token?.sub) {
        // Use sub as providerAccountId if no other ID is available
        (token as JWTWithProviderAccountId).providerAccountId = token.sub;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.providerAccountId) {
        session.user.providerAccountId = token.providerAccountId as string;
      }
      // Set the user ID - this is critical for server actions
      session.user.id = (token.sub || token.providerAccountId || '') as string;
      // Ensure required fields are set
      session.user.name =
        session.user.name || token.name || token.email?.split('@')[0] || 'User';
      session.user.email = session.user.email || token.email || '';
      session.user.image = session.user.image || token.picture || '';
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
