import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

export default function SignInPage() {
  async function handleSignIn(formData: FormData) {
    "use server";
    const email = formData.get("email") as string;
    if (!email) return;

    await signIn("credentials", {
      email,
      redirect: false,
    });

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

        <form action={handleSignIn} className="space-y-4">
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
