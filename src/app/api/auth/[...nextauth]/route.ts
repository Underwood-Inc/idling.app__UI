import NextAuth from "next-auth/next";
import { authOptions } from "../nextauth.twitch";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
