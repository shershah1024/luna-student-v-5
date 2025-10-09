export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET endpoint to fetch user's organization
export async function GET() {
  try {
    // Get authenticated user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user organization from Supabase
    const { data, error } = await supabase
      .from('user_organizations')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error
    }

    if (!data) {
      return NextResponse.json({ 
        organization: null,
        message: 'No organization found for user'
      })
    }

    return NextResponse.json({
      organization: {
        name: data.organization_name,
        code: data.organization_code,
        referredFrom: data.referred_from,
        firstPartnerVisit: data.first_partner_visit,
        lastPartnerVisit: data.last_partner_visit,
        isPartnerUser: true
      }
    })

  } catch (error) {
    console.error('Failed to fetch user organization:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}