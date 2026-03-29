import { getOrgId } from "@/lib/get-org";
import { redirect } from "next/navigation";
import { prisma } from "@adpilot/db";
import Link from "next/link";

export default async function OnboardingPage() {
  
  

  const orgId = await getOrgId();

  // Check onboarding progress
  const [org, connectionCount, campaignCount] = await Promise.all([
    prisma.organization.findUnique({ where: { id: orgId }, select: { name: true, plan: true } }),
    prisma.platformConnection.count({ where: { orgId, status: "ACTIVE" } }),
    prisma.campaign.count({ where: { orgId } }),
  ]);

  if (!org) redirect("/org-picker");

  const steps = [
    { label: "Create organization", done: true, href: "/dashboard" },
    { label: "Connect a platform", done: connectionCount > 0, href: "/dashboard/settings/connections" },
    { label: "Create your first campaign", done: campaignCount > 0, href: "/campaigns/new" },
    { label: "Upgrade your plan", done: org.plan !== "FREE", href: "/dashboard/settings/billing" },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;

  return (
    <div className="max-w-lg mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-2">Welcome to AdPilot!</h1>
      <p className="text-gray-500 mb-8">
        {allDone
          ? "You're all set! Start managing your campaigns."
          : `Complete these steps to get started (${completedCount}/${steps.length})`}
      </p>

      <div className="space-y-3">
        {steps.map((step, i) => (
          <Link
            key={i}
            href={step.href}
            className={`flex items-center gap-3 p-4 border rounded-lg ${step.done ? "bg-green-50 border-green-200" : "hover:bg-gray-50"}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step.done ? "bg-green-600 text-white" : "bg-gray-200 text-gray-600"}`}>
              {step.done ? "\u2713" : i + 1}
            </div>
            <span className={step.done ? "line-through text-gray-400" : ""}>{step.label}</span>
          </Link>
        ))}
      </div>

      {allDone && (
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Go to Dashboard
        </Link>
      )}
    </div>
  );
}
