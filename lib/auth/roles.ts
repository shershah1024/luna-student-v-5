/**
 * Role utilities for Clerk Organizations
 *
 * Simple role-based access control - no custom permissions needed!
 * Access control is handled at the frontend/metadata level.
 *
 * Role Hierarchy:
 * - Platform Admin: is_platform_admin metadata flag (SaaS owners)
 * - Institute Admin: org:institute_admin role (institute administrators)
 * - Teacher: org:teacher role (teaching staff)
 * - Student: is_student metadata flag (students managed through metadata, not direct login)
 *
 * Note: Only Platform Admins, Institute Admins, and Teachers can login directly.
 * Students are created and managed by teachers/admins with metadata flags.
 */

import { auth } from "@clerk/nextjs/server"

export type UserRole = 'platform_admin' | 'institute_admin' | 'teacher' | 'student' | 'guest'

/**
 * Get the current user's role based on their Clerk organization membership and metadata
 */
export async function getUserRole(): Promise<UserRole> {
  const { userId, sessionClaims, orgRole } = await auth()

  if (!userId) {
    return 'guest'
  }

  const metadata = {
    ...(sessionClaims?.publicMetadata as Record<string, any>),
    ...(sessionClaims?.metadata as Record<string, any>),
  }

  // Check for platform admin in metadata
  if (metadata?.is_platform_admin || metadata?.role === 'platform_admin') {
    return 'platform_admin'
  }

  // Check for student in metadata (students are managed, not direct login)
  if (metadata?.is_student || metadata?.role === 'student') {
    return 'student'
  }

  // Check for teacher metadata (for independent teachers)
  if (metadata?.is_teacher || metadata?.role === 'teacher') {
    return 'teacher'
  }

  if (metadata?.is_institute_admin || metadata?.role === 'institute_admin') {
    return 'institute_admin'
  }

  // Check organization role
  if (orgRole === 'org:institute_admin') {
    return 'institute_admin'
  }

  if (orgRole === 'org:teacher') {
    return 'teacher'
  }

  // Guest/unknown user (no role assigned)
  return 'guest'
}

/**
 * Check if user has a specific role
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const userRole = await getUserRole()
  return userRole === role
}

/**
 * Check if user is a platform admin
 */
export async function isPlatformAdmin(): Promise<boolean> {
  return await hasRole('platform_admin')
}

/**
 * Check if user is an institute admin
 */
export async function isInstituteAdmin(): Promise<boolean> {
  return await hasRole('institute_admin')
}

/**
 * Check if user is a teacher
 */
export async function isTeacher(): Promise<boolean> {
  return await hasRole('teacher')
}

/**
 * Check if user is a student
 */
export async function isStudent(): Promise<boolean> {
  return await hasRole('student')
}

/**
 * Check if user can create assignments (teachers and admins)
 */
export async function canCreateAssignments(): Promise<boolean> {
  const role = await getUserRole()
  return role === 'teacher' || role === 'institute_admin' || role === 'platform_admin'
}

/**
 * Check if user can manage institute settings (admins only)
 */
export async function canManageInstitute(): Promise<boolean> {
  const role = await getUserRole()
  return role === 'institute_admin' || role === 'platform_admin'
}

/**
 * Check if user can invite students
 */
export async function canInviteStudents(): Promise<boolean> {
  const role = await getUserRole()
  return role === 'teacher' || role === 'institute_admin' || role === 'platform_admin'
}

/**
 * Check if user can invite teachers
 */
export async function canInviteTeachers(): Promise<boolean> {
  const role = await getUserRole()
  return role === 'institute_admin' || role === 'platform_admin'
}

/**
 * Get user's current organization info
 */
export async function getUserOrganization() {
  const { orgId, orgSlug } = await auth()
  return { orgId, orgSlug }
}
