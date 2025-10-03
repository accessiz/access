import { createBrowserClient } from '@supabase/ssr'

// Define una función para crear el cliente del lado del cliente (navegador)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}