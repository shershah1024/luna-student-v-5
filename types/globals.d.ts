/**
 * Global type definitions for Clerk RBAC implementation
 * Following Clerk's 2024 best practices
 */

export type UserRole = 'admin' | 'teacher' | 'student' | 'parent'

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: UserRole
    }
  }
}

export {}