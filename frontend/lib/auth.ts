import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "Email",
    credentials: {
      email: { label: "Email", type: "email", placeholder: "name@example.com" },
    },
    async authorize(credentials) {
      if (!credentials?.email) return null;

      let user = await prisma.user.findUnique({
        where: { email: credentials.email },
      });

      if (!user) {
        user = await prisma.user.create({
          data: { email: credentials.email, name: credentials.email.split("@")[0] },
        });
      }

      return { id: user.id, email: user.email, name: user.name, image: user.image };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.unshift(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      // Allow credentials sign-in without adapter session creation
      if (account?.provider === "credentials") return true;
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      // Support forwarded URLs (VS Code port forwarding, ngrok, etc.)
      // If the URL is relative, use the current base URL
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // If the URL is on the same origin, allow it
      if (new URL(url).origin === baseUrl) return url;
      // Default to dashboard after successful sign in
      return `${baseUrl}/dashboard`;
    },
  },
  pages: {
    signIn: "/auth",
  },
};
