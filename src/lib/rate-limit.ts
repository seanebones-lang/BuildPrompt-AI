import { SUBSCRIPTION_TIERS, type SubscriptionTier } from "@/types";

/**
 * In-memory rate limiting store
 * In production, this should be replaced with Redis or similar
 */
const rateLimitStore = new Map<
  string,
  {
    count: number;
    resetTime: number;
  }
>();

/**
 * Rate limit configuration by tier
 */
const RATE_LIMITS: Record<
  SubscriptionTier,
  { requestsPerMinute: number; requestsPerDay: number }
> = {
  free: { requestsPerMinute: 5, requestsPerDay: 20 },
  pro: { requestsPerMinute: 30, requestsPerDay: 500 },
  enterprise: { requestsPerMinute: 100, requestsPerDay: 10000 },
};

/**
 * Check if user has exceeded their rate limit
 */
export function checkRateLimit(
  userId: string,
  tier: SubscriptionTier
): {
  allowed: boolean;
  remaining: number;
  resetIn: number;
} {
  const now = Date.now();
  const limits = RATE_LIMITS[tier];
  const key = `${userId}:minute`;

  const existing = rateLimitStore.get(key);

  // Clean up expired entries
  if (existing && now > existing.resetTime) {
    rateLimitStore.delete(key);
  }

  const current = rateLimitStore.get(key);

  if (!current) {
    // First request in this window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + 60000, // 1 minute
    });
    return {
      allowed: true,
      remaining: limits.requestsPerMinute - 1,
      resetIn: 60,
    };
  }

  if (current.count >= limits.requestsPerMinute) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.ceil((current.resetTime - now) / 1000),
    };
  }

  current.count++;
  return {
    allowed: true,
    remaining: limits.requestsPerMinute - current.count,
    resetIn: Math.ceil((current.resetTime - now) / 1000),
  };
}

/**
 * Whitelisted IPs that bypass rate limiting
 */
const WHITELISTED_IPS = ['69.110.193.185'];

/**
 * Check daily rate limit (for demo mode IP-based limiting)
 */
export function checkDailyRateLimit(
  identifier: string,
  maxPerDay: number = 5
): {
  allowed: boolean;
  remaining: number;
  resetIn: number;
} {
  // Bypass rate limit for whitelisted IPs
  if (WHITELISTED_IPS.includes(identifier)) {
    return {
      allowed: true,
      remaining: 999999,
      resetIn: 0,
    };
  }

  const now = Date.now();
  const key = `${identifier}:daily`;

  const existing = rateLimitStore.get(key);

  // Clean up expired entries
  if (existing && now > existing.resetTime) {
    rateLimitStore.delete(key);
  }

  const current = rateLimitStore.get(key);

  if (!current) {
    // First request in this window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + 24 * 60 * 60 * 1000, // 24 hours
    });
    return {
      allowed: true,
      remaining: maxPerDay - 1,
      resetIn: 24 * 60 * 60, // seconds
    };
  }

  if (current.count >= maxPerDay) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.ceil((current.resetTime - now) / 1000),
    };
  }

  current.count++;
  return {
    allowed: true,
    remaining: maxPerDay - current.count,
    resetIn: Math.ceil((current.resetTime - now) / 1000),
  };
}

/**
 * Check if user has exceeded their monthly build limit
 */
export function checkMonthlyLimit(
  buildsUsed: number,
  tier: SubscriptionTier
): {
  allowed: boolean;
  remaining: number;
  limit: number;
} {
  const tierInfo = SUBSCRIPTION_TIERS[tier];
  const limit = tierInfo.monthlyBuilds;

  // Enterprise has unlimited (-1)
  if (limit === -1) {
    return {
      allowed: true,
      remaining: -1,
      limit: -1,
    };
  }

  const remaining = Math.max(0, limit - buildsUsed);
  return {
    allowed: remaining > 0,
    remaining,
    limit,
  };
}

/**
 * Get remaining time until monthly reset (first of next month)
 */
export function getMonthlyResetTime(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

/**
 * Clean up expired rate limit entries (call periodically)
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupRateLimits, 5 * 60 * 1000);
}
