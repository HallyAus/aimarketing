import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import Resend from "next-auth/providers/resend";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import WebAuthn from "next-auth/providers/webauthn";
import bcrypt from "bcryptjs";
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
  experimental: { enableWebAuthn: true },
  providers: [
    // Email + Password
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
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

    // Magic Link via Resend
    ...(process.env.RESEND_API_KEY
      ? [
          Resend({
            from: process.env.EMAIL_FROM || "AdPilot <noreply@adpilot.ai>",
            apiKey: process.env.RESEND_API_KEY,
          }),
        ]
      : []),

    // Google OAuth
    ...(process.env.GOOGLE_CLIENT_ID
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),

    // Microsoft / Azure AD (personal + work accounts)
    ...(process.env.MICROSOFT_CLIENT_ID
      ? [
          MicrosoftEntraID({
            clientId: process.env.MICROSOFT_CLIENT_ID,
            clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
            // "common" allows personal + work accounts
            issuer: "https://login.microsoftonline.com/common/v2.0/",
          }),
        ]
      : []),

    // Passkeys / WebAuthn
    WebAuthn,
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
          where: {
            userId_orgId: {
              userId: token.userId as string,
              orgId: orgCookie.value,
            },
          },
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
