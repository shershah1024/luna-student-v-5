/**
 * Simplified Clerk middleware for learner-only application
 * All authenticated users can access learning features
 */

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

// Public routes - no authentication required
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/clerk',
  '/coming-soon',
  '/forbidden',
])

// Public API routes
const isPublicApiRoute = createRouteMatcher([
  '/api/public(.*)',
  '/api/connection-details(.*)', // Allow connection details for LiveKit
])

export default clerkMiddleware(async (auth, request) => {
  // Allow public routes
  if (isPublicRoute(request) || isPublicApiRoute(request)) {
    return
  }

  const { userId, redirectToSignIn } = await auth()

  // Require authentication for all protected routes
  if (!userId) {
    return redirectToSignIn()
  }

  // All authenticated users can access learning features
  return
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}