import { createClient } from '@supabase/supabase-js'

// ¡Importante! Estas variables DEBEN estar en tu .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

// --- ¡CORREGIDO! ---
// Usamos el nombre de tu variable: SUPABASE_SERVICE_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL no está definida.')
}
if (!supabaseServiceKey) {
  // Actualizamos el mensaje de error para que coincida
  throw new Error('SUPABASE_SERVICE_KEY no está definida. Esta llave es necesaria para operaciones de admin.')
}

// Este cliente 'admin' ignora RLS. Úsalo con MUCHO cuidado.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    // Desactiva el auto-refresh y la persistencia de sesión
    autoRefreshToken: false,
    persistSession: false
  }
})