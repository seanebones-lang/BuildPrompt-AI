"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// PostHog Analytics Configuration
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";

// Initialize PostHog (if configured)
let posthog: {
  capture: (event: string, properties?: Record<string, unknown>) => void;
  identify: (distinctId: string, properties?: Record<string, unknown>) => void;
} | null = null;

if (typeof window !== "undefined" && POSTHOG_KEY) {
  import("posthog-js").then((module) => {
    const ph = module.default;
    ph.init(POSTHOG_KEY!, {
      api_host: POSTHOG_HOST,
      capture_pageview: false, // We handle this manually
      capture_pageleave: true,
      persistence: "localStorage",
    });
    posthog = ph;
  });
}

/**
 * Track a custom event
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>
) {
  if (posthog) {
    posthog.capture(eventName, properties);
  }

  // Also log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log(`[Analytics] ${eventName}`, properties);
  }
}

/**
 * Identify a user
 */
export function identifyUser(
  userId: string,
  properties?: Record<string, unknown>
) {
  if (posthog) {
    posthog.identify(userId, properties);
  }
}

/**
 * Track specific BuildPrompt events
 */
export const BuildPromptEvents = {
  BUILD_STARTED: "build_started",
  BUILD_COMPLETED: "build_completed",
  BUILD_FAILED: "build_failed",
  PROMPT_COPIED: "prompt_copied",
  PDF_EXPORTED: "pdf_exported",
  SUBSCRIPTION_STARTED: "subscription_started",
  SUBSCRIPTION_CANCELLED: "subscription_cancelled",
} as const;

/**
 * Analytics component for automatic page view tracking
 */
export function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (posthog && pathname) {
      // Track page view
      posthog.capture("$pageview", {
        $current_url: window.location.href,
        path: pathname,
        search: searchParams.toString(),
      });
    }
  }, [pathname, searchParams]);

  // This component doesn't render anything
  return null;
}

/**
 * Sentry Error Tracking Setup
 * Call this in your app initialization if Sentry is configured
 */
export async function initErrorTracking() {
  const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (!SENTRY_DSN) {
    return;
  }

  try {
    const Sentry = await import("@sentry/nextjs");

    Sentry.init({
      dsn: SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      integrations: [
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
    });
  } catch (error) {
    console.error("Failed to initialize Sentry:", error);
  }
}

/**
 * Report an error to Sentry
 */
export async function reportError(
  error: Error,
  context?: Record<string, unknown>
) {
  try {
    const Sentry = await import("@sentry/nextjs");
    Sentry.captureException(error, {
      extra: context,
    });
  } catch {
    // Sentry not available, just log
    console.error("Error:", error, context);
  }
}
