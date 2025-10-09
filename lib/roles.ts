/**
 * Simplified role utilities for learner-only application
 * All authenticated users are learners with access to learning features
 */

// Simplified user role for learner app
export enum UserRole {
  STUDENT = 'student',
}

// Legacy exports for backward compatibility
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.STUDENT]: 100,
}

// Get user role from Clerk user object
export function getUserRole(user: any): UserRole {
  return UserRole.STUDENT
}

// Get default role for new users
export function getDefaultRole(): UserRole {
  return UserRole.STUDENT
}