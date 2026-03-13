/**
 * Supabase client factory for Server Actions (`'use server'`).
 * Per-invocation (NOT cached like server.ts) with cookie propagation.
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { env } from '@/lib/env'

/**
 * Creates an authenticated Supabase client for use inside Server Actions.
 * Must be called at the TOP of every `'use server'` action (not cached).
 */
export async function createSupabaseServerActionClient() {
  const cookieStore = await cookies()
  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options) {
          try { cookieStore.set({ name, value, ...options }) } catch { }
        },
        remove(name: string, options) {
          try { cookieStore.set({ name, value: '', ...options }) } catch { }
        },
      },
    }
  )
}
