import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature, stripe } from "@/lib/stripe";
import { updateUserSubscription } from "@/lib/supabase";
import type { SubscriptionTier } from "@/types";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const event = verifyWebhookSignature(body, signature);

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const customerId = session.customer as string;
        const userId = session.metadata?.userId;

        if (userId && customerId) {
          // Get subscription details to determine tier
          const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: "active",
            limit: 1,
          });

          let tier: SubscriptionTier = "pro";
          if (subscriptions.data.length > 0) {
            const priceId = subscriptions.data[0].items.data[0]?.price.id;
            if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) {
              tier = "enterprise";
            }
          }

          await updateUserSubscription(userId, tier, customerId);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        // Get user by Stripe customer ID and update their subscription
        if (subscription.status === "active") {
          const priceId = subscription.items.data[0]?.price.id;
          let tier: SubscriptionTier = "pro";

          if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) {
            tier = "enterprise";
          } else if (
            priceId === process.env.STRIPE_PRO_MONTHLY_PRICE_ID ||
            priceId === process.env.STRIPE_PRO_YEARLY_PRICE_ID
          ) {
            tier = "pro";
          }

          // Note: In production, you'd look up the user by customerId
          console.log(`Subscription updated for customer ${customerId}: ${tier}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        // Downgrade to free tier when subscription is canceled
        console.log(`Subscription canceled for customer ${customerId}`);
        // In production: find user by customerId and update to "free"
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const customerId = invoice.customer as string;

        // Handle failed payment - could send notification or retry
        console.log(`Payment failed for customer ${customerId}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);

    if (error instanceof Error && error.message.includes("signature")) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
