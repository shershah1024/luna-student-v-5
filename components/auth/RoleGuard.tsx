/**
 * Component to protect pages based on user roles
 * Wraps content and only renders if user has required permissions
 */

'use client'

import { useUserRole } from '@/hooks/useUserRole'
import { UserRole } from '@/lib/roles'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  minimumRole?: UserRole
  fallbackUrl?: string
  showLoading?: boolean
  loadingComponent?: React.ReactNode
  unauthorizedComponent?: React.ReactNode
}

export function RoleGuard({
  children,
  allowedRoles,
  minimumRole,
  fallbackUrl = '/forbidden',
  showLoading = true,
  loadingComponent,
  unauthorizedComponent,
}: RoleGuardProps) {
  const { role, isLoaded, hasMinimumRole, hasAnyRole } = useUserRole()
  const router = useRouter()
  
  // Check permissions
  const hasPermission = (() => {
    if (!role) return false
    if (allowedRoles) return hasAnyRole(allowedRoles)
    if (minimumRole) return hasMinimumRole(minimumRole)
    return true
  })()
  
  useEffect(() => {
    if (isLoaded && !hasPermission) {
      router.push(fallbackUrl)
    }
  }, [isLoaded, hasPermission, router, fallbackUrl])
  
  // Show loading state
  if (!isLoaded && showLoading) {
    return loadingComponent || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }
  
  // Show unauthorized state
  if (isLoaded && !hasPermission) {
    return unauthorizedComponent || null
  }
  
  // Render children if authorized
  return <>{children}</>
}