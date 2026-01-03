import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createCheckoutSession, createStripeCustomer } from "@/lib/stripe";
import { getOrCreateUser, updateUserSubscription } from "@/lib/supabase";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { priceId, tier } = body;

    if (!priceId || !tier) {
      return NextResponse.json(
        { error: "Price ID and tier are required" },
        { status: 400 }
      );
    }

    // Get or create user
    const user = await getOrCreateUser(userId, "", "");
    if (!user) {
      return NextResponse.json(
        { error: "Failed to get user" },
        { status: 500 }
      );
    }

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      customerId = await createStripeCustomer(user.email, user.name, {
        userId,
      });
      await updateUserSubscription(userId, user.subscriptionTier, customerId);
    }

    // Create checkout session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const checkoutUrl = await createCheckoutSession(
      customerId,
      priceId,
      `${appUrl}/dashboard?success=true`,
      `${appUrl}/pricing?canceled=true`
    );

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
