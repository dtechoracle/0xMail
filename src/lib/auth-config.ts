import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          // Check if user exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email || "" },
          });

          if (!existingUser) {
            // Create new user with Google account
            await prisma.user.create({
              data: {
                email: user.email || "",
                name: user.name || "",
                emailVerified: new Date(),
                // Google OAuth users skip email verification
              },
            });
          } else {
            // Update existing user
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                name: user.name || existingUser.name,
                emailVerified: existingUser.emailVerified || new Date(),
              },
            });
          }
        } catch (error) {
          console.error("Error in Google sign-in:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      if (account?.provider === "google") {
        // Generate JWT token for our API
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email || "" },
        });
        
        if (dbUser) {
          const apiToken = jwt.sign(
            { userId: dbUser.id, email: dbUser.email },
            process.env.JWT_SECRET || "your-secret-key",
            { expiresIn: "30d" }
          );
          token.apiToken = apiToken;
          token.userId = dbUser.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).apiToken = token.apiToken as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // After successful Google OAuth, redirect to callback page to store token
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/auth/callback`;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
};

