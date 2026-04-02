import { getSessionOrg } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Get Started",
  robots: { index: false },
};

export default async function OnboardingPage() {
  const orgId = await getSessionOrg();

  // Check onboarding progress
  const [org, connectionCount, campaignCount] = await Promise.all([
    prisma.organization.findUnique({ where: { id: orgId }, select: { name: true, plan: true } }),
    prisma.platformConnection.count({ where: { orgId, status: "ACTIVE" } }),
    prisma.campaign.count({ where: { orgId } }),
  ]);

  if (!org) redirect("/org-picker");

  const steps = [
    { label: "Create organization", done: true, href: "/dashboard" },
    { label: "Connect a platform", done: connectionCount > 0, href: "/settings/connections" },
    { label: "Create your first campaign", done: campaignCount > 0, href: "/campaigns/new" },
    { label: "Upgrade your plan", done: org.plan !== "FREE", href: "/settings/billing" },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;

  return (
    <div className="max-w-lg mx-auto mt-8">
      <PageHeader
        title="Welcome to AdPilot!"
        subtitle={
          allDone
            ? "You're all set! Start managing your campaigns."
            : `Complete these steps to get started (${completedCount}/${steps.length})`
        }
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Get Started" },
        ]}
      />

      <div className="space-y-3">
        {steps.map((step, i) => (
          <Link
            key={i}
            href={step.href}
            className="flex items-center gap-3 p-4 rounded-lg card-hover"
            style={{
              border: step.done
                ? "1px solid rgba(16,185,129,0.3)"
                : "1px solid var(--border-primary)",
              background: step.done
                ? "rgba(16,185,129,0.07)"
                : "var(--bg-secondary)",
            }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
              style={{
                background: step.done ? "var(--accent-emerald)" : "var(--bg-elevated)",
                color: step.done ? "white" : "var(--text-secondary)",
              }}
            >
              {step.done ? "\u2713" : i + 1}
            </div>
            <span
              style={{
                color: step.done ? "var(--text-tertiary)" : "var(--text-primary)",
                textDecoration: step.done ? "line-through" : "none",
              }}
            >
              {step.label}
            </span>
          </Link>
        ))}
      </div>

      {allDone && (
        <Link href="/dashboard" className="btn-primary mt-6 inline-block text-sm">
          Go to Dashboard
        </Link>
      )}
    </div>
  );
}
