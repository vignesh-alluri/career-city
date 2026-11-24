import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Only the PUBLIC key goes in the browser (the "anon"/publishable key). It is safe to expose because
 * Row Level Security in the database decides what each signed-in user may read or change.
 * The service_role key bypasses RLS and must never appear anywhere in this project.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(url && key)

let client: SupabaseClient<Database> | null = null

/**
 * Created on first use, not at import time. That way a missing .env.local produces one clear message
 * inside the app screens instead of crashing the public landing page.
 */
export function getSupabase(): SupabaseClient<Database> {
  if (client) return client
  if (!url || !key) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local and restart the dev server.')
  }
  client = createClient<Database>(url, key)
  return client
}
