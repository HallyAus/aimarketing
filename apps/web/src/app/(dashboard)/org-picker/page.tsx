import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@adpilot/db";
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
        <h1 className="text-xl font-bold mb-4">Create Your Organization</h1>
        <p className="text-gray-500 mb-6">Get started by creating your first organization.</p>
        <Link
          href="/dashboard/create-org"
          className="rounded-md bg-blue-600 px-6 py-2 text-white font-medium hover:bg-blue-700"
        >
          Create Organization
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-16">
      <h1 className="text-xl font-bold mb-6">Select Organization</h1>
      <div className="space-y-2">
        {memberships.map((m) => (
          <button
            key={m.organization.id}
            className="w-full text-left border rounded-lg p-4 hover:bg-gray-50"
          >
            <div className="font-medium">{m.organization.name}</div>
            <div className="text-sm text-gray-500">
              {m.organization.plan} &middot; {m.role}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
