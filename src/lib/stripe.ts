import Stripe from "stripe";
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from "@/types";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export { stripe };

/**
 * Create a Stripe customer for a new user
 */
export async function createStripeCustomer(
  email: string,
  name?: string,
  metadata?: Record<string, string>
): Promise<string> {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      source: "buildprompt-ai",
      ...metadata,
    },
  });

  return customer.id;
}

/**
 * Create a checkout session for subscription upgrade
 */
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
  });

  return session.url!;
}

/**
 * Create a billing portal session for subscription management
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session.url;
}

/**
 * Get subscription status from Stripe
 */
export async function getSubscriptionStatus(
  customerId: string
): Promise<SubscriptionTier> {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return "free";
    }

    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0]?.price.id;

    // Match price ID to tier
    if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) {
      return "enterprise";
    } else if (
      priceId === process.env.STRIPE_PRO_MONTHLY_PRICE_ID ||
      priceId === process.env.STRIPE_PRO_YEARLY_PRICE_ID
    ) {
      return "pro";
    }

    return "free";
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    return "free";
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<boolean> {
  try {
    await stripe.subscriptions.cancel(subscriptionId);
    return true;
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return false;
  }
}

/**
 * Record usage for metered billing (usage-based add-on)
 */
export async function recordMeteredUsage(
  subscriptionItemId: string,
  quantity: number,
  timestamp?: number
): Promise<boolean> {
  try {
    await stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
      quantity,
      timestamp: timestamp || Math.floor(Date.now() / 1000),
      action: "increment",
    });
    return true;
  } catch (error) {
    console.error("Error recording metered usage:", error);
    return false;
  }
}

/**
 * Get price details for display
 */
export function getPriceDisplay(tier: SubscriptionTier): string {
  const info = SUBSCRIPTION_TIERS[tier];
  if (info.price === 0) return "Free";
  return `$${info.price}/month`;
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
