import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Demo mode - bypass all authentication
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/pricing",
  "/api/generate", // Allow anonymous builds (with rate limiting)
  "/api/webhooks/(.*)", // Stripe webhooks
]);

export default clerkMiddleware(async (auth, req) => {
  // In demo mode, treat all routes as public
  if (DEMO_MODE) {
    return;
  }

  // Protect non-public routes
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
