/**
 * Simplified role utilities for learner-centric application (v2)
 * This is a minimal stub for compatibility with existing imports
 * All authenticated users are learners with access to learning features
 */

import { auth } from '@clerk/nextjs/server'

/**
 * Check if the current user has a specific role
 * In this learner-centric app, we only support 'student' role
 * Returns false for admin/teacher checks since this is a learner-only app
 *
 * @param role - The role to check for ('admin', 'teacher', 'student', 'parent')
 * @returns boolean indicating if user has the role
 */
export async function checkRole(role: string): Promise<boolean> {
  const { sessionClaims } = await auth()

  // Everyone is a student in this learner app
  if (role === 'student') {
    return !!sessionClaims
  }

  // No admin/teacher functionality in learner app
  // Return false for backward compatibility
  return false
}

/**
 * Get the current user's role from their session
 * Always returns 'student' for authenticated users in this learner app
 */
export async function getUserRole(): Promise<string | null> {
  const { sessionClaims } = await auth()

  if (!sessionClaims) {
    return null
  }

  return 'student'
}
