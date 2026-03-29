import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SignInPage() {
  // If already signed in, go to dashboard
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Sign in to AdPilot</h1>
          <p className="text-sm text-gray-500 mt-2">
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
          <input
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm"
          />
          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
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
