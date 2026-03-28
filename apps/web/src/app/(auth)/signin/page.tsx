import { signIn } from "@/lib/auth";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Sign in to AdPilot</h1>
          <p className="text-sm text-gray-500 mt-2">
            Manage your marketing campaigns
          </p>
        </div>

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Continue with Google
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">Or</span>
          </div>
        </div>

        <form
          action={async (formData: FormData) => {
            "use server";
            await signIn("resend", {
              email: formData.get("email") as string,
              redirectTo: "/dashboard",
            });
          }}
          className="space-y-4"
        >
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
            Send Magic Link
          </button>
        </form>
      </div>
    </main>
  );
}
