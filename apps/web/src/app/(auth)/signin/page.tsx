import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to AdPilot to manage your marketing campaigns, scheduling, and analytics.",
};

export const dynamic = "force-dynamic";

export default async function SignInPage() {
  // If already signed in, go to dashboard
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center"
      style={{ background: "var(--bg-primary)" }}
    >
      <div
        className="w-full max-w-sm space-y-6 p-6 md:p-8 rounded-xl mx-4 md:mx-0"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-primary)",
        }}
      >
        <div className="text-center">
          <div className="section-label mb-3">Marketing Intelligence Platform</div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Sign in to AdPilot
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
            Manage your marketing campaigns
          </p>
        </div>

        {/* Plain HTML form — posts directly to NextAuth, browser handles cookies */}
        <form
          method="POST"
          action="/api/auth/callback/credentials"
          className="space-y-4"
        >
          <CsrfToken />
          <label htmlFor="signin-email" className="sr-only">Email address</label>
          <input
            id="signin-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
            className="w-full rounded-md px-4 py-3 md:py-2 text-sm"
          />
          <button
            type="submit"
            className="btn-primary w-full text-sm py-3 md:py-2 min-h-[44px]"
          >
            Sign In
          </button>
        </form>
      </div>
    </main>
  );
}

async function CsrfToken() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const csrfCookie = cookieStore.get("authjs.csrf-token");
  const csrfToken = csrfCookie?.value?.split("|")[0] ?? "";

  return <input type="hidden" name="csrfToken" value={csrfToken} />;
}
