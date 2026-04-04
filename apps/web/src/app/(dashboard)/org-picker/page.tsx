import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function OrgPickerPage() {

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }

  const memberships = await prisma.membership.findMany({
    where: { userId: session.user.id },
    include: {
      organization: {
        select: { id: true, name: true, slug: true, plan: true },
      },
    },
  });

  if (memberships.length === 0) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <h1 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>Create Your Organization</h1>
        <p className="mb-6" style={{ color: "var(--text-secondary)" }}>Get started by creating your first organization.</p>
        <Link
          href="/dashboard/create-org"
          className="btn-primary"
        >
          Create Organization
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-16">
      <h1 className="text-xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>Select Organization</h1>
      <div className="space-y-2">
        {memberships.map((m) => (
          <form action={async () => {
            "use server";
            const { cookies: getCookies } = await import("next/headers");
            const cookieStore = await getCookies();
            cookieStore.set("reachpilot-org-id", m.organization.id, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "strict",
              path: "/",
              maxAge: 60 * 60 * 24 * 30,
            });
            const { redirect } = await import("next/navigation");
            redirect("/dashboard");
          }} key={m.organization.id}>
            <button
              type="submit"
              className="w-full text-left rounded-lg p-4 card card-hover"
            >
              <div className="font-medium" style={{ color: "var(--text-primary)" }}>{m.organization.name}</div>
              <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{m.organization.plan} &middot; {m.role}</div>
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
