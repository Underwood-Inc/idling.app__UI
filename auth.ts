import NextAuth from "next-auth";
import twitch from "next-auth/providers/twitch";

export const { auth, handlers, signIn, signOut } = NextAuth({
  // secret: process.env.NEXTAUTH_SECRET,
  providers: [twitch],
  // debug: true,
  // pages: {
  //   signIn: "/auth/signin",
  // },
  // session: { strategy: "jwt" },
  // callbacks: {
  //   async signIn(userDetail) {
  //     console.log("userDetail", userDetail);
  //     return Object.keys(userDetail).length !== 0;
  //   },
  //   async redirect({ baseUrl }) {
  //     console.log("baseUrl", baseUrl);
  //     return `${baseUrl}/protected`;
  //   },
  //   async session({ session, token }) {
  //     console.log("session, token", session, token);
  //     if (session.user?.name) session.user.name = token.name;
  //     return session;
  //   },
  //   async jwt({ token, user }) {
  //     let newUser = { ...user } as any;
  //     console.log("token, user", token, user);
  //     if (newUser.first_name && newUser.last_name)
  //       token.name = `${newUser.first_name} ${newUser.last_name}`;
  //     return token;
  //   },
  // },
});
