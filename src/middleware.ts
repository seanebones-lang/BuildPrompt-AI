import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Demo mode - bypass all authentication
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export default async function middleware(req: NextRequest) {
  // In demo mode, allow all requests without authentication
  if (DEMO_MODE) {
    return NextResponse.next();
  }

  // In production mode with real auth, use Clerk
  // Dynamically import Clerk only when needed
  const { clerkMiddleware, createRouteMatcher } = await import("@clerk/nextjs/server");

  const isPublicRoute = createRouteMatcher([
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/pricing",
    "/api/generate", // Allow anonymous builds (with rate limiting)
    "/api/webhooks/(.*)", // Stripe webhooks
  ]);

  // Create and return Clerk middleware
  const clerkMw = clerkMiddleware(async (auth, request) => {
    if (!isPublicRoute(request)) {
      await auth.protect();
    }
  });

  return clerkMw(req);
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
