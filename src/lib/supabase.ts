import { createClient } from '@supabase/supabase-js'

let supabase: ReturnType<typeof createClient> | null = null

export function getSupabase() {
  if (!supabase) {
    const url = import.meta.env.PUBLIC_SUPABASE_URL
    const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      throw new Error('Supabase env vars missing')
    }

    supabase = createClient(url, key)
  }

  return supabase
}