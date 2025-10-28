import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/db-types' // ¡Añadimos esta línea!

// Define una función para crear el cliente del lado del cliente (navegador)
export function createClient() {
  return createBrowserClient<Database>( // ¡Añadimos <Database> aquí!
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}