"use client";

import React from "react";

/**
 * Mock Clerk Provider for demo mode
 * This prevents build errors when Clerk hooks are used in pages
 */
export function MockClerkProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
