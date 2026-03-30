import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import { prisma } from "@adpilot/db";
import { redirect } from "next/navigation";

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
