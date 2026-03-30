/**
 * Stripe Product & Price Seeding Script
 *
 * Creates AdPilot Free/Pro/Agency products and their monthly/annual prices
 * in Stripe. Idempotent — skips products that already exist (matched by
 * metadata.adpilot_plan).
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_test_xxx npx tsx scripts/seed-stripe.ts
 *
 * Or via the package.json script:
 *   STRIPE_SECRET_KEY=sk_test_xxx pnpm stripe:seed
 */

import Stripe from "stripe";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PlanDefinition {
  key: string;
  name: string;
  monthlyPriceUsd: number;
  annualPriceUsd: number;
  features: string[];
}

interface CreatedPrice {
  interval: "month" | "year";
  id: string;
  amount: number;
}

interface SeedResult {
  plan: string;
  productId: string;
  prices: CreatedPrice[];
  existed: boolean;
}

// ---------------------------------------------------------------------------
// Plan definitions
// ---------------------------------------------------------------------------

const PLANS: PlanDefinition[] = [
  {
    key: "FREE",
    name: "AdPilot Free",
    monthlyPriceUsd: 0,
    annualPriceUsd: 0,
    features: [
      "1 organization",
      "2 platform connections",
      "10 posts/month",
      "30-day analytics retention",
    ],
  },
  {
    key: "PRO",
    name: "AdPilot Pro",
    monthlyPriceUsd: 4900, // $49.00 in cents
    annualPriceUsd: 47000, // $470.00 in cents (20% off $588)
    features: [
      "1 organization",
      "5 platform connections",
      "Unlimited posts",
      "5 team members",
      "365-day analytics retention",
      "Approval workflow",
    ],
  },
  {
    key: "AGENCY",
    name: "AdPilot Agency",
    monthlyPriceUsd: 29900, // $299.00 in cents
    annualPriceUsd: 287000, // $2,870.00 in cents (20% off $3,588)
    features: [
      "Unlimited organizations",
      "Unlimited platform connections",
      "Unlimited posts",
      "Unlimited team members",
      "Unlimited analytics retention",
      "Approval workflow",
      "AI insights",
      "White-label",
      "API access",
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error(
      "Error: STRIPE_SECRET_KEY environment variable is not set.\n" +
        "Usage: STRIPE_SECRET_KEY=sk_test_xxx npx tsx scripts/seed-stripe.ts",
    );
    process.exit(1);
  }
  return new Stripe(key, { typescript: true });
}

function formatDollars(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

async function findExistingProduct(
  stripe: Stripe,
  planKey: string,
): Promise<Stripe.Product | null> {
  // Search by metadata — only returns active products
  const products = await stripe.products.search({
    query: `metadata["adpilot_plan"]:"${planKey}"`,
  });
  return products.data[0] ?? null;
}

async function getExistingPrices(
  stripe: Stripe,
  productId: string,
): Promise<Stripe.Price[]> {
  const prices = await stripe.prices.list({
    product: productId,
    active: true,
    limit: 10,
  });
  return prices.data;
}

// ---------------------------------------------------------------------------
// Core seeding logic
// ---------------------------------------------------------------------------

async function seedPlan(
  stripe: Stripe,
  plan: PlanDefinition,
): Promise<SeedResult> {
  // Check if product already exists
  const existing = await findExistingProduct(stripe, plan.key);

  if (existing) {
    console.log(`Product already exists: ${plan.name} (${existing.id})`);
    const existingPrices = await getExistingPrices(stripe, existing.id);

    const prices: CreatedPrice[] = existingPrices
      .filter(
        (p) =>
          p.recurring?.interval === "month" ||
          p.recurring?.interval === "year",
      )
      .map((p) => ({
        interval: p.recurring!.interval as "month" | "year",
        id: p.id,
        amount: p.unit_amount ?? 0,
      }));

    // Create any missing prices
    const hasMonthly = prices.some((p) => p.interval === "month");
    const hasAnnual = prices.some((p) => p.interval === "year");

    if (!hasMonthly) {
      const monthlyPrice = await createPrice(
        stripe,
        existing.id,
        plan.monthlyPriceUsd,
        "month",
        plan.key,
      );
      prices.push(monthlyPrice);
    }

    if (!hasAnnual) {
      const annualPrice = await createPrice(
        stripe,
        existing.id,
        plan.annualPriceUsd,
        "year",
        plan.key,
      );
      prices.push(annualPrice);
    }

    for (const p of prices) {
      const label = p.interval === "month" ? "Monthly" : "Annual";
      const suffix = p.interval === "month" ? "/mo" : "/yr";
      console.log(
        `  ${label}: ${formatDollars(p.amount)}${suffix} (${p.id})`,
      );
    }

    return { plan: plan.key, productId: existing.id, prices, existed: true };
  }

  // Create new product
  const product = await stripe.products.create({
    name: plan.name,
    metadata: { adpilot_plan: plan.key },
    features: plan.features.map((name) => ({ name })),
  });

  console.log(`Created product: ${plan.name} (${product.id})`);

  // Create monthly price
  const monthlyPrice = await createPrice(
    stripe,
    product.id,
    plan.monthlyPriceUsd,
    "month",
    plan.key,
  );
  console.log(
    `  Monthly: ${formatDollars(monthlyPrice.amount)}/mo (${monthlyPrice.id})`,
  );

  // Create annual price
  const annualPrice = await createPrice(
    stripe,
    product.id,
    plan.annualPriceUsd,
    "year",
    plan.key,
  );
  console.log(
    `  Annual: ${formatDollars(annualPrice.amount)}/yr (${annualPrice.id})`,
  );

  return {
    plan: plan.key,
    productId: product.id,
    prices: [monthlyPrice, annualPrice],
    existed: false,
  };
}

async function createPrice(
  stripe: Stripe,
  productId: string,
  unitAmount: number,
  interval: "month" | "year",
  planKey: string,
): Promise<CreatedPrice> {
  const price = await stripe.prices.create({
    product: productId,
    currency: "usd",
    unit_amount: unitAmount,
    recurring: { interval },
    metadata: {
      adpilot_plan: planKey,
      adpilot_interval: interval === "month" ? "monthly" : "annual",
    },
  });
  return { interval, id: price.id, amount: unitAmount };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("Seeding Stripe products and prices...\n");

  const stripe = getStripeClient();

  // Verify the key works
  try {
    await stripe.balance.retrieve();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error: Failed to connect to Stripe: ${message}`);
    process.exit(1);
  }

  const results: SeedResult[] = [];

  for (const plan of PLANS) {
    const result = await seedPlan(stripe, plan);
    results.push(result);
    console.log();
  }

  // Print env block
  console.log("─".repeat(60));
  console.log("Add these to your .env:\n");

  for (const result of results) {
    const monthly = result.prices.find((p) => p.interval === "month");
    const annual = result.prices.find((p) => p.interval === "year");

    if (monthly) {
      console.log(
        `STRIPE_${result.plan}_MONTHLY_PRICE_ID=${monthly.id}`,
      );
    }
    if (annual) {
      console.log(
        `STRIPE_${result.plan}_ANNUAL_PRICE_ID=${annual.id}`,
      );
    }
  }

  console.log();

  const created = results.filter((r) => !r.existed).length;
  const skipped = results.filter((r) => r.existed).length;
  console.log(
    `Done. ${created} product(s) created, ${skipped} already existed.`,
  );
}

main().catch((err: unknown) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
