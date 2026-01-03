import { createClient } from "@supabase/supabase-js";
import type { UserProfile, UsageRecord } from "@/types";

// Supabase client for browser (public anon key)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client with service role (for admin operations)
export function getServiceSupabase() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceKey);
}

/**
 * Database table names
 */
export const TABLES = {
  USERS: "users",
  BUILDS: "builds",
  USAGE: "usage_records",
} as const;

/**
 * Get or create user profile
 */
export async function getOrCreateUser(
  clerkUserId: string,
  email: string,
  name?: string
): Promise<UserProfile | null> {
  const client = getServiceSupabase();

  // Try to get existing user
  const { data: existingUser } = await client
    .from(TABLES.USERS)
    .select("*")
    .eq("id", clerkUserId)
    .single();

  if (existingUser) {
    return existingUser as UserProfile;
  }

  // Create new user
  const newUser: Omit<UserProfile, "createdAt" | "updatedAt"> = {
    id: clerkUserId,
    email,
    name,
    subscriptionTier: "free",
    buildsUsedThisMonth: 0,
  };

  const { data, error } = await client
    .from(TABLES.USERS)
    .insert(newUser)
    .select()
    .single();

  if (error) {
    console.error("Error creating user:", error);
    return null;
  }

  return data as UserProfile;
}

/**
 * Get user's current usage for the month
 */
export async function getUserMonthlyUsage(userId: string): Promise<number> {
  const client = getServiceSupabase();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count } = await client
    .from(TABLES.USAGE)
    .select("*", { count: "exact", head: true })
    .eq("userId", userId)
    .gte("createdAt", startOfMonth.toISOString());

  return count ?? 0;
}

/**
 * Record a build usage
 */
export async function recordUsage(
  userId: string,
  buildId: string,
  tokensUsed: number
): Promise<boolean> {
  const client = getServiceSupabase();

  const record: Omit<UsageRecord, "id" | "createdAt"> = {
    userId,
    buildId,
    tokensUsed,
  };

  const { error } = await client.from(TABLES.USAGE).insert(record);

  if (error) {
    console.error("Error recording usage:", error);
    return false;
  }

  // Update user's monthly count
  await client.rpc("increment_builds_count", { user_id: userId });

  return true;
}

/**
 * Update user subscription tier
 */
export async function updateUserSubscription(
  userId: string,
  tier: UserProfile["subscriptionTier"],
  stripeCustomerId?: string
): Promise<boolean> {
  const client = getServiceSupabase();

  const { error } = await client
    .from(TABLES.USERS)
    .update({
      subscriptionTier: tier,
      stripeCustomerId,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error("Error updating subscription:", error);
    return false;
  }

  return true;
}

/**
 * Reset monthly build counts (called by cron job)
 */
export async function resetMonthlyBuilds(): Promise<boolean> {
  const client = getServiceSupabase();

  const { error } = await client
    .from(TABLES.USERS)
    .update({ buildsUsedThisMonth: 0 });

  if (error) {
    console.error("Error resetting monthly builds:", error);
    return false;
  }

  return true;
}
