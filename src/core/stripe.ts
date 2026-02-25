import Stripe from "stripe";
import { getEnv } from "@/core/env";

let cachedStripe: Stripe | null = null;

export function getStripe() {
  if (cachedStripe) {
    return cachedStripe;
  }

  const env = getEnv();
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  cachedStripe = new Stripe(env.STRIPE_SECRET_KEY, {
    typescript: true,
  });

  return cachedStripe;
}
