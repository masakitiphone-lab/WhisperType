import { openUrl } from "@tauri-apps/plugin-opener";

const stripeCheckoutUrl = import.meta.env.VITE_STRIPE_CHECKOUT_URL;

export function hasStripeCheckoutUrl() {
  return typeof stripeCheckoutUrl === "string" && stripeCheckoutUrl.trim().length > 0;
}

export async function openStripeCheckout() {
  if (!hasStripeCheckoutUrl()) {
    throw new Error("Stripe checkout URL is not configured.");
  }

  await openUrl(stripeCheckoutUrl);
}
