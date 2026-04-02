import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import type { Plan } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const orgId = session.metadata?.orgId;
      const plan = session.metadata?.plan as Plan;
      if (orgId && plan) {
        await prisma.organization.update({
          where: { id: orgId },
          data: {
            plan,
            stripeSubscriptionId: session.subscription as string,
            billingCycleAnchor: new Date(),
          },
        });
        await prisma.auditLog.create({
          data: {
            orgId,
            action: "PLAN_UPGRADE",
            entityType: "Organization",
            entityId: orgId,
            after: { plan },
          },
        });
      }
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object;
      const customerId = invoice.customer as string;
      const org = await prisma.organization.findFirst({
        where: { stripeCustomerId: customerId },
      });
      if (org) {
        await prisma.organization.update({
          where: { id: org.id },
          data: { billingCycleAnchor: new Date() },
        });
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const customerId = invoice.customer as string;
      const org = await prisma.organization.findFirst({
        where: { stripeCustomerId: customerId },
      });
      if (org) {
        // TODO: Send warning email, start 3-day grace period
        await prisma.auditLog.create({
          data: {
            orgId: org.id,
            action: "PAYMENT_FAILED",
            entityType: "Organization",
            entityId: org.id,
          },
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const customerId = subscription.customer as string;
      const org = await prisma.organization.findFirst({
        where: { stripeCustomerId: customerId },
      });
      if (org) {
        await prisma.organization.update({
          where: { id: org.id },
          data: { plan: "FREE", stripeSubscriptionId: null },
        });
        await prisma.auditLog.create({
          data: {
            orgId: org.id,
            action: "PLAN_DOWNGRADE",
            entityType: "Organization",
            entityId: org.id,
            after: { plan: "FREE" },
          },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
