import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@adpilot/db";

const basePrismaAdapter = PrismaAdapter(prisma);

const nextAuth = NextAuth({
  adapter: {
    ...basePrismaAdapter,
    async useVerificationToken(params) {
      try {
        return await basePrismaAdapter.useVerificationToken!(params);
      } catch {
        return null;
      }
    },
  },
  session: { strategy: "jwt" },
  providers: [
    // Email/password — always available, no external API needed
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        if (!email) return null;

        // Find or create user
        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          user = await prisma.user.create({
            data: { email, emailVerified: new Date() },
          });
        }

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
  ],
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
      }

      // Check for org switch cookie
      const { cookies: getCookies } = await import("next/headers");
      const cookieStore = await getCookies();
      const orgCookie = cookieStore.get("adpilot-org-id");

      if (orgCookie?.value && token.userId) {
        const membership = await prisma.membership.findUnique({
          where: { userId_orgId: { userId: token.userId as string, orgId: orgCookie.value } },
        });
        if (membership) {
          token.currentOrgId = membership.orgId;
          token.currentRole = membership.role;
          return token;
        }
      }

      // Fallback: auto-select if single org
      if (token.userId && !token.currentOrgId) {
        const memberships = await prisma.membership.findMany({
          where: { userId: token.userId as string },
          orderBy: { createdAt: "asc" },
        });
        const first = memberships[0];
        if (memberships.length === 1 && first) {
          token.currentOrgId = first.orgId;
          token.currentRole = first.role;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.currentOrgId = token.currentOrgId as string | undefined;
        session.user.currentRole = token.currentRole as string | undefined;
      }
      return session;
    },
  },
  trustHost: true,
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        path: "/",
      },
    },
  },
});

export const { handlers, auth, signIn, signOut } = nextAuth;
