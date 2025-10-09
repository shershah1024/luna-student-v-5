/**
 * Simplified client-side hook for learner-only application
 * All authenticated users are learners
 */

'use client'

import { useUser } from "@clerk/nextjs"

export function useUserRole() {
  const { user, isLoaded } = useUser()

  return {
    user,
    isLoaded,
    isAuthenticated: !!user,
  }
}