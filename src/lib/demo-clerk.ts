/**
 * Mock Clerk hooks for demo mode
 * Returns fake data to prevent build/runtime errors
 */

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export function useDemoUser() {
  if (!DEMO_MODE) {
    // In production, use real Clerk
    const { useUser } = require("@clerk/nextjs");
    return useUser();
  }

  // Mock user data for demo mode
  return {
    isSignedIn: true,
    isLoaded: true,
    user: {
      id: "demo_user",
      firstName: "Demo",
      lastName: "User",
      emailAddresses: [{ emailAddress: "demo@example.com" }],
    },
  };
}

export function useDemoAuth() {
  if (!DEMO_MODE) {
    // In production, use real Clerk
    const { useAuth } = require("@clerk/nextjs");
    return useAuth();
  }

  // Mock auth data for demo mode
  return {
    isSignedIn: true,
    isLoaded: true,
    userId: "demo_user",
  };
}
