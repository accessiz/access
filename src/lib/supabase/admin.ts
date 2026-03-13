import { createClient } from '@supabase/supabase-js'
import { env, serverEnv } from '@/lib/env'

/** Admin client — bypasses RLS. Use with extreme caution. */
export const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  serverEnv.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)