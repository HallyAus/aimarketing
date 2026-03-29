import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
      typescript: true,
    });
  }
  return _stripe;
}

export const STRIPE_PLAN_PRICES: Record<string, string> = {
  PRO: process.env.STRIPE_PRO_PRICE_ID ?? "",
  AGENCY: process.env.STRIPE_AGENCY_PRICE_ID ?? "",
};
