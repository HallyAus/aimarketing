import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler } from "@/lib/api-handler";
import { getStripe, STRIPE_PLAN_PRICES } from "@/lib/stripe";
import { prisma } from "@/lib/db";

// POST /api/billing/checkout — create Stripe Checkout session
export const POST = withErrorHandler(withRole("OWNER", async (req) => {
  const { plan } = await req.json();
  if (!plan || !STRIPE_PLAN_PRICES[plan]) {
    return NextResponse.json(
      { error: "Invalid plan", code: "INVALID_PLAN", statusCode: 400 },
      { status: 400 }
    );
  }

  const org = await prisma.organization.findUnique({
    where: { id: req.orgId },
  });
  if (!org) {
    return NextResponse.json({ error: "Org not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  // Create or retrieve Stripe customer
  let customerId = org.stripeCustomerId;
  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: org.billingEmail ?? undefined,
      metadata: { orgId: org.id, orgSlug: org.slug },
    });
    customerId = customer.id;
    await prisma.organization.update({
      where: { id: org.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: STRIPE_PLAN_PRICES[plan], quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?canceled=true`,
    metadata: { orgId: org.id, plan },
  });

  return NextResponse.json({ url: session.url });
}));
