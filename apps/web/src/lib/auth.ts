import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

const nextAuth = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        passkeyToken: { label: "Passkey Token", type: "text" },
        twoFactorCode: { label: "2FA Code", type: "text" },
      },
      async authorize(credentials) {
        // Passkey-based sign-in: the passkey verify endpoint sets a short-lived
        // token that we validate here so the user gets a real session.
        if (credentials?.passkeyToken) {
          try {
            const passkeySession = await prisma.session.findUnique({
              where: { sessionToken: credentials.passkeyToken as string },
              include: { user: true },
            });
            if (!passkeySession || passkeySession.expires < new Date()) return null;
            // Clean up the temp session
            await prisma.session.delete({ where: { id: passkeySession.id } });
            const user = passkeySession.user;
            return { id: user.id, email: user.email, name: user.name };
          } catch {
            return null;
          }
        }

        if (!credentials?.email || !credentials?.password) return null;
        // Retry once on failure (Neon cold start can timeout on first query)
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const user = await prisma.user.findUnique({
              where: { email: (credentials.email as string).toLowerCase() },
            });
            if (!user?.password) return null;
            const valid = await bcrypt.compare(
              credentials.password as string,
              user.password,
            );
            if (!valid) return null;

            // Check if 2FA is enabled
            const twoFactor = await prisma.twoFactorSecret.findUnique({
              where: { userId: user.id },
              select: { verified: true },
            });
            if (twoFactor?.verified) {
              // If a 2FA code was provided (second step), validate it
              if (credentials.twoFactorCode) {
                // Verification is handled by the /api/auth/2fa/verify endpoint
                // which updates the session. Here we just pass through.
              }
              // Return user with a flag indicating 2FA is needed
              return {
                id: user.id,
                email: user.email,
                name: user.name,
                requiresTwoFactor: !credentials.twoFactorCode,
              } as any;
            }

            return { id: user.id, email: user.email, name: user.name };
          } catch (e) {
            console.error(`[auth] authorize attempt ${attempt + 1} error:`, e);
            if (attempt === 0) await new Promise((r) => setTimeout(r, 1000));
          }
        }
        return null;
      },
    }),

    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM || "ReachPilot <noreply@reachpilot.co>",
    }),

    // Google OAuth — add GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET to enable
    // Microsoft — add MICROSOFT_CLIENT_ID + MICROSOFT_CLIENT_SECRET to enable
  ],
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user?.email) return false;

      // For email provider (magic link): allow sign-in, adapter creates user if needed
      if (account?.provider === "resend") {
        // Check if user exists and is banned/suspended
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { status: true },
        });
        if (existingUser?.status === "BANNED" || existingUser?.status === "SUSPENDED") {
          return false;
        }
        return true;
      }

      // For credentials provider: check if user is banned/suspended
      if (account?.provider === "credentials") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { status: true },
        });
        if (existingUser?.status === "BANNED" || existingUser?.status === "SUSPENDED") {
          return false;
        }
        return true;
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        // Carry 2FA flag from authorize result
        if ((user as any).requiresTwoFactor) {
          token.requiresTwoFactor = true;
          token.twoFactorVerified = false;
        }
      }

      // Auto-select org on sign-in or when not yet set.
      // IMPORTANT: This DB call runs on every JWT refresh (every request that
      // checks auth). Any uncaught exception here propagates as a
      // CallbackRouteError which next-auth surfaces to the client as
      // "Configuration". Wrap defensively so a transient DB hiccup never
      // blocks sign-in.
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
          // Silently ignore — token is still valid without the org fields.
          // They will be populated on the next request once the DB recovers.
        }
      }

      // Fetch systemRole on first sign-in or when not yet set.
      if (token.userId && !token.systemRole) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.userId as string },
            select: { systemRole: true },
          });
          if (dbUser) {
            token.systemRole = dbUser.systemRole;
          }
        } catch {
          // Silently ignore — defaults to no admin access.
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.currentOrgId = token.currentOrgId as string | undefined;
        session.user.currentRole = token.currentRole as string | undefined;
        session.user.systemRole = token.systemRole as string | undefined;
        (session.user as any).requiresTwoFactor = token.requiresTwoFactor as boolean | undefined;
        (session.user as any).twoFactorVerified = token.twoFactorVerified as boolean | undefined;
      }
      return session;
    },
  },
  // trustHost is required when NEXTAUTH_URL / AUTH_URL are set but the
  // incoming Host header differs (common on Vercel preview deployments).
  trustHost: true,
  // Do NOT override the cookies block. The partial override in v5 beta
  // replaces options instead of merging them, which strips the cookie
  // "name" field. Without a name the SessionStore cannot match the
  // incoming session cookie and authorize() returns null, which the
  // library surfaces as a "Configuration" error.
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
