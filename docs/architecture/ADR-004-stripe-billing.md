# ADR-004: Stripe for Billing

**Date:** 2026-03-15
**Status:** Accepted

## Context

ReachPilot offers three subscription tiers (Free, Pro at $49/month, Agency at $299/month) with both monthly and annual billing cycles. We needed a billing provider that supports:

- Subscription lifecycle management (trials, upgrades, downgrades, cancellation)
- Webhook-driven state synchronization (no polling)
- PCI-compliant payment collection
- Invoice generation and hosted payment pages
- Support for Australian businesses

## Decision

Use **Stripe** as the sole billing provider with a **webhook-first architecture**.

All billing state changes flow through the Stripe webhook handler at `/api/stripe/webhook`, which processes six event types:

| Event | Action |
|---|---|
| `customer.subscription.created` | Sync subscription status to org |
| `customer.subscription.updated` | Update plan, period dates, cancellation flag |
| `customer.subscription.deleted` | Downgrade org to FREE plan |
| `invoice.payment_succeeded` | Upsert invoice record, clear PAST_DUE status |
| `invoice.payment_failed` | Mark org as PAST_DUE |
| `payment_method.attached` / `detached` | Sync payment method records |

Plan limits (max users, platforms, posts/month) are enforced at the application level based on the `Organization.plan` field, which is the source of truth after webhook sync.

## Consequences

**Benefits:**

- Webhook-first approach ensures the database always reflects Stripe's state, even if the user closes the browser mid-checkout.
- Stripe Checkout handles PCI compliance; no card data touches our servers.
- Hosted invoice URLs allow users to view/download invoices without custom UI.
- Audit logs are created for every billing event for compliance and debugging.

**Trade-offs:**

- Stripe takes 2.9% + 30c per transaction.
- Webhook signature verification adds latency to the webhook endpoint.
- Testing requires Stripe CLI for local webhook forwarding (`stripe listen --forward-to`).

## Alternatives Considered

| Alternative | Reason Rejected |
|---|---|
| **Paddle** | Higher fees, less granular API, limited webhook event types |
| **LemonSqueezy** | Merchant of record model adds complexity; less control over subscription management |
| **Custom billing** | PCI compliance burden is not justified for a small team |
