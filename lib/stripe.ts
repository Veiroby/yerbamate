import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  // In development this will surface clearly; in production this must be set.
  console.warn("STRIPE_SECRET_KEY is not set. Stripe calls will fail.");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-02-25.clover",
});

