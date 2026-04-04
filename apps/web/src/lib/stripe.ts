import Stripe from "stripe";
import { STRIPE_PLAN_PRICE_IDS } from "@reachpilot/shared";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
      typescript: true,
    });
  }
  return _stripe;
}

/** @deprecated Use STRIPE_PLAN_PRICE_IDS from @reachpilot/shared directly */
export const STRIPE_PLAN_PRICES = STRIPE_PLAN_PRICE_IDS;
