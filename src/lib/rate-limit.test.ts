import { describe, it, expect, beforeEach, vi } from "vitest";
import { checkRateLimit, checkMonthlyLimit, getMonthlyResetTime } from "./rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("should allow first request", () => {
    const result = checkRateLimit("user-1", "free");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4); // 5 - 1 = 4 for free tier
  });

  it("should track requests per user", () => {
    // First user's requests
    checkRateLimit("user-1", "free");
    checkRateLimit("user-1", "free");
    const user1Result = checkRateLimit("user-1", "free");
    expect(user1Result.remaining).toBe(2);

    // Second user should have fresh limit
    const user2Result = checkRateLimit("user-2", "free");
    expect(user2Result.remaining).toBe(4);
  });

  it("should have higher limits for pro tier", () => {
    const result = checkRateLimit("pro-user", "pro");
    expect(result.remaining).toBe(29); // 30 - 1 = 29 for pro tier
  });

  it("should have highest limits for enterprise tier", () => {
    const result = checkRateLimit("enterprise-user", "enterprise");
    expect(result.remaining).toBe(99); // 100 - 1 = 99 for enterprise tier
  });
});

describe("checkMonthlyLimit", () => {
  it("should allow when under limit", () => {
    const result = checkMonthlyLimit(2, "free");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(3); // 5 - 2 = 3
  });

  it("should block when at limit", () => {
    const result = checkMonthlyLimit(5, "free");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("should block when over limit", () => {
    const result = checkMonthlyLimit(10, "free");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("should return unlimited for enterprise", () => {
    const result = checkMonthlyLimit(1000, "enterprise");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(-1);
    expect(result.limit).toBe(-1);
  });

  it("should have higher limit for pro", () => {
    const result = checkMonthlyLimit(50, "pro");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(50); // 100 - 50 = 50
  });
});

describe("getMonthlyResetTime", () => {
  it("should return first of next month", () => {
    const now = new Date(2025, 5, 15); // June 15, 2025
    vi.setSystemTime(now);

    const resetTime = getMonthlyResetTime();

    expect(resetTime.getMonth()).toBe(6); // July
    expect(resetTime.getDate()).toBe(1);
    expect(resetTime.getFullYear()).toBe(2025);
  });

  it("should handle December correctly", () => {
    const now = new Date(2025, 11, 15); // December 15, 2025
    vi.setSystemTime(now);

    const resetTime = getMonthlyResetTime();

    expect(resetTime.getMonth()).toBe(0); // January
    expect(resetTime.getDate()).toBe(1);
    expect(resetTime.getFullYear()).toBe(2026);
  });
});
