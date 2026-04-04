"use server";

import { redirect } from "next/navigation";
import { getSessionOrg } from "@/lib/auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createCampaignSchema, sanitizeHtml } from "@reachpilot/shared";

export type CreateCampaignState = {
  error?: string;
};

/**
 * Coerce a datetime-local value ("2026-03-30T14:00") to a full ISO 8601 UTC
 * string ("2026-03-30T14:00:00.000Z").  The Zod `z.string().datetime()` validator
 * requires a timezone designator, but the browser's datetime-local input never
 * emits one.
 */
function toIsoDatetime(raw: string): string {
  // Already has a timezone offset or trailing Z — leave it alone.
  if (/[Z+\-]\d*$/.test(raw)) return raw;
  // Pad seconds/milliseconds if missing then append Z (treat as UTC).
  const padded = raw.length === 16 ? `${raw}:00.000Z` : `${raw}.000Z`;
  return padded;
}

export async function createCampaign(
  _prevState: CreateCampaignState,
  formData: FormData
): Promise<CreateCampaignState> {
  // Authenticate — getSessionOrg redirects to /signin if no session.
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in to create a campaign." };
  }

  const orgId = await getSessionOrg();

  const rawStartDate = formData.get("startDate") as string | null;
  const rawEndDate = formData.get("endDate") as string | null;
  const rawBudget = formData.get("budget") as string | null;

  // Auto-schedule fields
  const autoScheduleEnabled = formData.get("autoScheduleEnabled") === "true";
  const autoScheduleInterval = formData.get("autoScheduleInterval") as string | null;
  const autoScheduleStartDate = formData.get("autoScheduleStartDate") as string | null;
  const autoScheduleEndDate = formData.get("autoScheduleEndDate") as string | null;

  const autoScheduleConfig = autoScheduleEnabled
    ? {
        autoSchedule: {
          enabled: true,
          intervalHours: autoScheduleInterval ? Number(autoScheduleInterval) : 6,
          startDate: autoScheduleStartDate ? toIsoDatetime(autoScheduleStartDate) : undefined,
          endDate: autoScheduleEndDate ? toIsoDatetime(autoScheduleEndDate) : undefined,
        },
      }
    : undefined;

  const body = {
    name: formData.get("name") as string,
    objective: formData.get("objective") as string,
    targetPlatforms: formData.getAll("platforms") as string[],
    budget: rawBudget ? Number(rawBudget) : undefined,
    currency: (formData.get("currency") as string | null) || "USD",
    startDate: rawStartDate ? toIsoDatetime(rawStartDate) : undefined,
    endDate: rawEndDate ? toIsoDatetime(rawEndDate) : undefined,
  };

  const parsed = createCampaignSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(", ");
    return { error: message };
  }

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) {
    return { error: "Organization not found." };
  }

  let campaign: { id: string };
  try {
    campaign = await prisma.campaign.create({
      data: {
        orgId,
        name: sanitizeHtml(parsed.data.name),
        objective: parsed.data.objective,
        budget: parsed.data.budget,
        currency: parsed.data.currency,
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
        targetPlatforms: parsed.data.targetPlatforms,
        audienceConfig: {
          ...(parsed.data.audienceConfig as Record<string, unknown> | null),
          ...autoScheduleConfig,
        } as never,
        createdBy: session.user.id,
      },
      select: { id: true },
    });
  } catch (err) {
    console.error("[createCampaign] DB error:", err);
    return { error: "Failed to save campaign. Please try again." };
  }

  await prisma.auditLog
    .create({
      data: {
        orgId,
        userId: session.user.id,
        action: "CREATE",
        entityType: "Campaign",
        entityId: campaign.id,
        after: { name: parsed.data.name, objective: parsed.data.objective },
      },
    })
    .catch((err) => console.error("[createCampaign] auditLog error:", err));

  // redirect() throws internally — must be called outside try/catch.
  redirect(`/campaigns/${campaign.id}`);
}
