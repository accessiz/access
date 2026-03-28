import type { User } from '@supabase/supabase-js'

import { createSupabaseServerActionClient } from '@/lib/supabase/server-action'

type AuthenticatedActionResult = {
  supabase: Awaited<ReturnType<typeof createSupabaseServerActionClient>>
  user: User
  error?: never
}

type UnauthenticatedActionResult = {
  supabase: Awaited<ReturnType<typeof createSupabaseServerActionClient>>
  user: null
  error: string
}

export async function requireAuthenticatedAction(
  errorMessage = 'Usuario no autenticado.'
): Promise<AuthenticatedActionResult | UnauthenticatedActionResult> {
  const supabase = await createSupabaseServerActionClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      supabase,
      user: null,
      error: errorMessage,
    }
  }

  return {
    supabase,
    user,
  }
}