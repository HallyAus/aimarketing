import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe-admin";

export const dynamic = "force-dynamic";

// Disable body parsing so we can verify the raw signature
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[stripe-webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case "payment_method.attached":
        await handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
        break;

      case "payment_method.detached":
        await handlePaymentMethodDetached(event.data.object as Stripe.PaymentMethod);
        break;

      default:
        // Unhandled event type
        break;
    }
  } catch (err) {
    console.error(`[stripe-webhook] Error handling ${event.type}:`, err);
    // Still return 200 to prevent Stripe retries on processing errors
  }

  return NextResponse.json({ received: true });
}

// ── Subscription Created / Updated ────────────────────────────────────

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer.id;

  const org = await prisma.organization.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!org) {
    console.warn(`[stripe-webhook] No org found for customer ${customerId}`);
    return;
  }

  const statusMap: Record<string, string> = {
    active: "ACTIVE",
    trialing: "TRIALING",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
    unpaid: "UNPAID",
    incomplete: "INCOMPLETE",
    paused: "PAUSED",
    incomplete_expired: "CANCELED",
  };

  const subscriptionStatus = statusMap[subscription.status] ?? "ACTIVE";

  await prisma.organization.update({
    where: { id: org.id },
    data: {
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscriptionStatus as "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELED" | "UNPAID" | "INCOMPLETE" | "PAUSED",
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    },
  });

  await prisma.auditLog.create({
    data: {
      orgId: org.id,
      action: `SUBSCRIPTION_${subscription.status.toUpperCase()}`,
      entityType: "Organization",
      entityId: org.id,
      after: {
        subscriptionId: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    },
  });
}

// ── Subscription Deleted ──────────────────────────────────────────────

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer.id;

  const org = await prisma.organization.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!org) return;

  await prisma.organization.update({
    where: { id: org.id },
    data: {
      plan: "FREE",
      subscriptionStatus: "CANCELED",
      stripeSubscriptionId: null,
      cancelAtPeriodEnd: false,
      maxUsers: 1,
      maxPlatforms: 3,
      maxPostsPerMonth: 30,
    },
  });

  await prisma.auditLog.create({
    data: {
      orgId: org.id,
      action: "SUBSCRIPTION_DELETED",
      entityType: "Organization",
      entityId: org.id,
      after: { subscriptionId: subscription.id, downgradedTo: "FREE" },
    },
  });
}

// ── Invoice Payment Succeeded ─────────────────────────────────────────

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === "string"
    ? invoice.customer
    : invoice.customer?.id;

  if (!customerId) return;

  const org = await prisma.organization.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!org) return;

  // Upsert invoice record
  await prisma.invoice.upsert({
    where: { stripeInvoiceId: invoice.id },
    create: {
      orgId: org.id,
      stripeInvoiceId: invoice.id,
      stripePaymentIntent: typeof invoice.payment_intent === "string"
        ? invoice.payment_intent
        : invoice.payment_intent?.id ?? null,
      number: invoice.number,
      status: "PAID",
      amountDue: invoice.amount_due,
      amountPaid: invoice.amount_paid,
      currency: invoice.currency,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      invoicePdf: invoice.invoice_pdf,
      periodStart: new Date(invoice.period_start * 1000),
      periodEnd: new Date(invoice.period_end * 1000),
      dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
      paidAt: new Date(),
    },
    update: {
      status: "PAID",
      amountPaid: invoice.amount_paid,
      paidAt: new Date(),
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      invoicePdf: invoice.invoice_pdf,
    },
  });

  // Ensure org is not marked past_due
  if (org.subscriptionStatus === "PAST_DUE") {
    await prisma.organization.update({
      where: { id: org.id },
      data: { subscriptionStatus: "ACTIVE" },
    });
  }

  await prisma.auditLog.create({
    data: {
      orgId: org.id,
      action: "INVOICE_PAID",
      entityType: "Invoice",
      entityId: invoice.id,
      after: {
        number: invoice.number,
        amountPaid: invoice.amount_paid,
        currency: invoice.currency,
      },
    },
  });
}

// ── Invoice Payment Failed ────────────────────────────────────────────

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === "string"
    ? invoice.customer
    : invoice.customer?.id;

  if (!customerId) return;

  const org = await prisma.organization.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!org) return;

  await prisma.organization.update({
    where: { id: org.id },
    data: { subscriptionStatus: "PAST_DUE" },
  });

  // Upsert invoice record
  await prisma.invoice.upsert({
    where: { stripeInvoiceId: invoice.id },
    create: {
      orgId: org.id,
      stripeInvoiceId: invoice.id,
      stripePaymentIntent: typeof invoice.payment_intent === "string"
        ? invoice.payment_intent
        : invoice.payment_intent?.id ?? null,
      number: invoice.number,
      status: "OPEN",
      amountDue: invoice.amount_due,
      amountPaid: invoice.amount_paid,
      currency: invoice.currency,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      invoicePdf: invoice.invoice_pdf,
      periodStart: new Date(invoice.period_start * 1000),
      periodEnd: new Date(invoice.period_end * 1000),
      dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
    },
    update: {
      status: "OPEN",
      amountPaid: invoice.amount_paid,
    },
  });

  await prisma.auditLog.create({
    data: {
      orgId: org.id,
      action: "INVOICE_PAYMENT_FAILED",
      entityType: "Invoice",
      entityId: invoice.id,
      after: {
        number: invoice.number,
        amountDue: invoice.amount_due,
        currency: invoice.currency,
      },
    },
  });
}

// ── Payment Method Attached ───────────────────────────────────────────

async function handlePaymentMethodAttached(pm: Stripe.PaymentMethod) {
  const customerId = typeof pm.customer === "string"
    ? pm.customer
    : pm.customer?.id;

  if (!customerId) return;

  const org = await prisma.organization.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!org) return;

  const card = pm.card;

  await prisma.paymentMethod.upsert({
    where: { stripePaymentMethodId: pm.id },
    create: {
      orgId: org.id,
      stripePaymentMethodId: pm.id,
      type: pm.type,
      brand: card?.brand ?? null,
      last4: card?.last4 ?? null,
      expMonth: card?.exp_month ?? null,
      expYear: card?.exp_year ?? null,
      isDefault: false,
    },
    update: {
      brand: card?.brand ?? null,
      last4: card?.last4 ?? null,
      expMonth: card?.exp_month ?? null,
      expYear: card?.exp_year ?? null,
    },
  });

  await prisma.auditLog.create({
    data: {
      orgId: org.id,
      action: "PAYMENT_METHOD_ATTACHED",
      entityType: "PaymentMethod",
      entityId: pm.id,
      after: { type: pm.type, brand: card?.brand, last4: card?.last4 },
    },
  });
}

// ── Payment Method Detached ───────────────────────────────────────────

async function handlePaymentMethodDetached(pm: Stripe.PaymentMethod) {
  try {
    await prisma.paymentMethod.delete({
      where: { stripePaymentMethodId: pm.id },
    });
  } catch {
    // Payment method may not exist in our DB
  }

  await prisma.auditLog.create({
    data: {
      action: "PAYMENT_METHOD_DETACHED",
      entityType: "PaymentMethod",
      entityId: pm.id,
      after: { type: pm.type },
    },
  });
}
