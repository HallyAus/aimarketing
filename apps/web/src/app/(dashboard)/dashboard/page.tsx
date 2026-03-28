import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@adpilot/db";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.currentOrgId) {
    redirect("/org-picker");
  }

  const org = await prisma.organization.findUnique({
    where: { id: session.user.currentOrgId },
    include: {
      _count: {
        select: {
          platformConnections: true,
          campaigns: true,
          memberships: true,
        },
      },
    },
  });

  if (!org) {
    redirect("/org-picker");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{org.name}</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="border rounded-lg p-4">
          <div className="text-sm text-gray-500">Connected Platforms</div>
          <div className="text-3xl font-bold">{org._count.platformConnections}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-gray-500">Campaigns</div>
          <div className="text-3xl font-bold">{org._count.campaigns}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-gray-500">Team Members</div>
          <div className="text-3xl font-bold">{org._count.memberships}</div>
        </div>
      </div>
      <p className="text-sm text-gray-500 mt-4">
        Plan: <span className="font-medium">{org.plan}</span>
      </p>
    </div>
  );
}
