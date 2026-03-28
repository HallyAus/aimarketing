import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

export const STRIPE_PLAN_PRICES: Record<string, string> = {
  PRO: process.env.STRIPE_PRO_PRICE_ID ?? "",
  AGENCY: process.env.STRIPE_AGENCY_PRICE_ID ?? "",
};
