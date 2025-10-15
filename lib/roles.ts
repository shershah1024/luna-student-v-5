/**
 * Simplified role utilities for learner-only application
 * All authenticated users are learners with access to learning features
 */

// Simplified user role for learner app
export enum UserRole {
  STUDENT = 'student',
  ADMIN = 'admin', // For backward compatibility with admin routes
}

// Legacy exports for backward compatibility
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.STUDENT]: 100,
  [UserRole.ADMIN]: 1000,
}

// Get user role from Clerk user object
export function getUserRole(user: any): UserRole {
  return UserRole.STUDENT
}

// Get default role for new users
export function getDefaultRole(): UserRole {
  return UserRole.STUDENT
}

// Validate if a role is valid
export function isValidRole(role: string): boolean {
  const validRoles = ['student', 'admin', 'teacher', 'parent']
  return validRoles.includes(role)
}