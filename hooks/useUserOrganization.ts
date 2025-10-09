import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface UserOrganization {
  name: string | null
  code: string | null
  referredFrom: string | null
  firstPartnerVisit: string | null
  lastPartnerVisit: string | null
  isPartnerUser: boolean
}

export function useUserOrganization() {
  const { user, isLoaded: userLoaded } = useUser()
  const [organization, setOrganization] = useState<UserOrganization>({
    name: null,
    code: null,
    referredFrom: null,
    firstPartnerVisit: null,
    lastPartnerVisit: null,
    isPartnerUser: false
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrganization() {
      if (!userLoaded || !user) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('user_organizations')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          throw error
        }

        if (data) {
          setOrganization({
            name: data.organization_name,
            code: data.organization_code,
            referredFrom: data.referred_from,
            firstPartnerVisit: data.first_partner_visit,
            lastPartnerVisit: data.last_partner_visit,
            isPartnerUser: true
          })
        } else {
          // User has no organization record
          setOrganization({
            name: null,
            code: null,
            referredFrom: null,
            firstPartnerVisit: null,
            lastPartnerVisit: null,
            isPartnerUser: false
          })
        }
      } catch (err) {
        console.error('Error fetching user organization:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchOrganization()
  }, [user, userLoaded])

  return { organization, loading, error }
}

// Helper function to check if user belongs to specific organization
export function useIsUserFromOrganization(orgCode: string) {
  const { organization, loading } = useUserOrganization()
  
  return {
    isFromOrganization: organization.code === orgCode,
    loading
  }
}