import NextAuth from 'next-auth';
import twitch from 'next-auth/providers/twitch';

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [twitch]
});
