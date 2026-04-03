import Stripe from "stripe";
import { prisma } from "@/lib/db";

function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key, {
    apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
  });
}

/** Lazy-initialized Stripe client — only fails when actually called, not at import time */
export function stripe(): Stripe {
  return getStripeClient();
}

// ── Price ID helpers ──────────────────────────────────────────────────

function getPriceId(plan: "PRO" | "AGENCY", cycle: "MONTHLY" | "ANNUAL"): string {
  const map: Record<string, string | undefined> = {
    PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY,
    PRO_ANNUAL: process.env.STRIPE_PRICE_PRO_ANNUAL,
    AGENCY_MONTHLY: process.env.STRIPE_PRICE_AGENCY_MONTHLY,
    AGENCY_ANNUAL: process.env.STRIPE_PRICE_AGENCY_ANNUAL,
  };
  const id = map[`${plan}_${cycle}`];
  if (!id) throw new Error(`Missing price ID for ${plan}_${cycle}`);
  return id;
}

// ── Get or Create Customer ────────────────────────────────────────────

export async function getOrCreateStripeCustomer(org: {
  id: string;
  name: string;
  billingEmail?: string | null;
  stripeCustomerId?: string | null;
}): Promise<string> {
  if (org.stripeCustomerId) {
    try {
      const existing = await getStripeClient().customers.retrieve(org.stripeCustomerId);
      if (!existing.deleted) return org.stripeCustomerId;
    } catch {
      // Customer deleted or invalid, create new one
    }
  }

  const customer = await getStripeClient().customers.create({
    name: org.name,
    email: org.billingEmail ?? undefined,
    metadata: { orgId: org.id },
  });

  await prisma.organization.update({
    where: { id: org.id },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

// ── Change Plan ───────────────────────────────────────────────────────

export async function changePlan(
  orgId: string,
  newPlan: "FREE" | "PRO" | "AGENCY"
): Promise<void> {
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: orgId },
  });

  const currentPlan = org.plan;
  const billingCycle = org.billingCycle ?? "MONTHLY";

  // No change
  if (currentPlan === newPlan) return;

  // Downgrade to FREE: cancel subscription at period end
  if (newPlan === "FREE") {
    if (org.stripeSubscriptionId) {
      try {
        await getStripeClient().subscriptions.update(org.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
      } catch (err) {
        console.error("[stripe-admin] Error canceling subscription:", err);
      }
    }
    await prisma.organization.update({
      where: { id: orgId },
      data: {
        cancelAtPeriodEnd: true,
      },
    });
    await prisma.auditLog.create({
      data: {
        orgId,
        action: "PLAN_CHANGE_SCHEDULED",
        entityType: "Organization",
        entityId: orgId,
        after: { from: currentPlan, to: "FREE", cancelAtPeriodEnd: true },
      },
    });
    return;
  }

  const priceId = getPriceId(newPlan, billingCycle);
  const customerId = await getOrCreateStripeCustomer(org);

  // Upgrade from FREE: create new subscription
  if (currentPlan === "FREE" || !org.stripeSubscriptionId) {
    const subscription = await getStripeClient().subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      metadata: { orgId },
    });

    const planLimits = getPlanLimits(newPlan);
    await prisma.organization.update({
      where: { id: orgId },
      data: {
        plan: newPlan,
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: "ACTIVE",
        cancelAtPeriodEnd: false,
        ...planLimits,
      },
    });

    await prisma.auditLog.create({
      data: {
        orgId,
        action: "PLAN_CHANGED",
        entityType: "Organization",
        entityId: orgId,
        after: { from: currentPlan, to: newPlan },
      },
    });
    return;
  }

  // PRO <-> AGENCY: update existing subscription item (prorated)
  try {
    const subscription = await getStripeClient().subscriptions.retrieve(org.stripeSubscriptionId);
    const itemId = subscription.items.data[0]?.id;
    if (!itemId) throw new Error("No subscription item found");

    await getStripeClient().subscriptions.update(org.stripeSubscriptionId, {
      items: [{ id: itemId, price: priceId }],
      proration_behavior: "create_prorations",
      cancel_at_period_end: false,
    });

    const planLimits = getPlanLimits(newPlan);
    await prisma.organization.update({
      where: { id: orgId },
      data: {
        plan: newPlan,
        cancelAtPeriodEnd: false,
        ...planLimits,
      },
    });

    await prisma.auditLog.create({
      data: {
        orgId,
        action: "PLAN_CHANGED",
        entityType: "Organization",
        entityId: orgId,
        after: { from: currentPlan, to: newPlan },
      },
    });
  } catch (err) {
    console.error("[stripe-admin] Error updating subscription:", err);
    throw err;
  }
}

// ── Cancel Subscription ───────────────────────────────────────────────

export async function cancelSubscription(
  orgId: string,
  atPeriodEnd: boolean = true
): Promise<void> {
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: orgId },
  });

  if (!org.stripeSubscriptionId) {
    throw new Error("Organization has no active subscription");
  }

  try {
    if (atPeriodEnd) {
      await getStripeClient().subscriptions.update(org.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
      await prisma.organization.update({
        where: { id: orgId },
        data: { cancelAtPeriodEnd: true },
      });
    } else {
      await getStripeClient().subscriptions.cancel(org.stripeSubscriptionId);
      await prisma.organization.update({
        where: { id: orgId },
        data: {
          subscriptionStatus: "CANCELED",
          cancelAtPeriodEnd: false,
          plan: "FREE",
          stripeSubscriptionId: null,
          ...getPlanLimits("FREE"),
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        orgId,
        action: atPeriodEnd ? "SUBSCRIPTION_CANCEL_SCHEDULED" : "SUBSCRIPTION_CANCELED",
        entityType: "Organization",
        entityId: orgId,
        after: { atPeriodEnd },
      },
    });
  } catch (err) {
    console.error("[stripe-admin] Error canceling subscription:", err);
    throw err;
  }
}

// ── Get Invoices ──────────────────────────────────────────────────────

export async function getInvoices(stripeCustomerId: string): Promise<Stripe.Invoice[]> {
  try {
    const invoices = await getStripeClient().invoices.list({
      customer: stripeCustomerId,
      limit: 50,
    });
    return invoices.data;
  } catch (err) {
    console.error("[stripe-admin] Error fetching invoices:", err);
    return [];
  }
}

// ── Get Upcoming Invoice ──────────────────────────────────────────────

export async function getUpcomingInvoice(
  stripeCustomerId: string
): Promise<Stripe.UpcomingInvoice | null> {
  try {
    const invoice = await getStripeClient().invoices.retrieveUpcoming({
      customer: stripeCustomerId,
    });
    return invoice;
  } catch {
    return null;
  }
}

// ── Plan Limits ───────────────────────────────────────────────────────

function getPlanLimits(plan: "FREE" | "PRO" | "AGENCY") {
  switch (plan) {
    case "FREE":
      return { maxUsers: 1, maxPlatforms: 3, maxPostsPerMonth: 30 };
    case "PRO":
      return { maxUsers: 5, maxPlatforms: 10, maxPostsPerMonth: 300 };
    case "AGENCY":
      return { maxUsers: 25, maxPlatforms: 50, maxPostsPerMonth: 3000 };
  }
}
