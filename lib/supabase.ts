import { createClient } from '@supabase/supabase-js'

const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      debug: false
    },
    global: {
      fetch: (url, options) => {
        // Disable logging for fetch requests
        return fetch(url, options)
      }
    }
  })
}

export const supabase = createSupabaseClient()
