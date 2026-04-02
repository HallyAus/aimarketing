import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@adpilot/db";
import { redirect } from "next/navigation";

const nextAuth = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: (credentials.email as string).toLowerCase() },
        });
        if (!user?.password) return null;
        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password,
        );
        if (!valid) return null;
        return { id: user.id, email: user.email, name: user.name };
      },
    }),

    // Google OAuth — add GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET to enable
    // Microsoft — add MICROSOFT_CLIENT_ID + MICROSOFT_CLIENT_SECRET to enable
    // Magic Link — add RESEND_API_KEY to enable
  ],
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.userId = user.id;
      }

      // Auto-select org on sign-in or when not set
      if (token.userId && !token.currentOrgId) {
        try {
          const memberships = await prisma.membership.findMany({
            where: { userId: token.userId as string },
            orderBy: { createdAt: "asc" },
          });
          const first = memberships[0];
          if (first) {
            token.currentOrgId = first.orgId;
            token.currentRole = first.role;
          }
        } catch {
          // DB may not be available during build
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
        secure: process.env.NODE_ENV === "production",
        path: "/",
      },
    },
  },
});

export const { handlers, auth, signIn, signOut } = nextAuth;

/**
 * Get the current user's org from their session.
 * Use in server components instead of the removed getOrgId().
 * Redirects to /signin if no session.
 */
export async function getSessionOrg(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }

  // If org is already in the session token, use it
  if (session.user.currentOrgId) {
    return session.user.currentOrgId;
  }

  // Fallback: look up first active org membership
  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    select: { orgId: true },
  });

  if (!membership) {
    redirect("/signin");
  }

  return membership.orgId;
}
