/**
 * Client-side hook for accessing user roles
 * Following Clerk's 2024 best practices
 */

'use client'

import { useUser } from '@clerk/nextjs'
import { UserRole } from '@/types/globals'

export function useUserRole() {
  const { user, isLoaded } = useUser()
  
  // Get role from public metadata
  const role = user?.publicMetadata?.role as UserRole | undefined
  
  // Role checks
  const isAdmin = role === 'admin'
  const isTeacher = role === 'teacher' || role === 'admin'
  const isStudent = role === 'student'
  const isParent = role === 'parent'
  
  // Helper functions
  const hasRole = (checkRole: UserRole) => role === checkRole
  
  const hasAnyRole = (roles: UserRole[]) => {
    return role ? roles.includes(role) : false
  }
  
  const hasMinimumRole = (minimumRole: UserRole) => {
    const hierarchy: Record<UserRole, number> = {
      admin: 100,
      teacher: 75,
      parent: 50,
      student: 25,
    }
    
    if (!role) return false
    return hierarchy[role] >= hierarchy[minimumRole]
  }
  
  return {
    // User and loading state
    user,
    isLoaded,
    role,
    
    // Direct role checks
    isAdmin,
    isTeacher,
    isStudent,
    isParent,
    
    // Helper functions
    hasRole,
    hasAnyRole,
    hasMinimumRole,
  }
}