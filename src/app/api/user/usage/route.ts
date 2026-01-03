import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser, getUserMonthlyUsage } from "@/lib/supabase";
import { SUBSCRIPTION_TIERS } from "@/types";
import { getMonthlyResetTime } from "@/lib/rate-limit";

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user
    const user = await getOrCreateUser(userId, "", "");
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get current usage
    const buildsUsed = await getUserMonthlyUsage(userId);
    const tierInfo = SUBSCRIPTION_TIERS[user.subscriptionTier];
    const monthlyLimit = tierInfo.monthlyBuilds;
    const remaining = monthlyLimit === -1 ? -1 : Math.max(0, monthlyLimit - buildsUsed);

    return NextResponse.json({
      tier: user.subscriptionTier,
      buildsUsed,
      monthlyLimit,
      remaining,
      resetDate: getMonthlyResetTime().toISOString(),
      features: tierInfo.features,
    });
  } catch (error) {
    console.error("Usage API error:", error);
    return NextResponse.json(
      { error: "Failed to get usage data" },
      { status: 500 }
    );
  }
}
