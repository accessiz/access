import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

// Se añade 'force-dynamic' para asegurar que se ejecute en el entorno de Node.js,
// evitando advertencias del Edge Runtime con las APIs de Supabase.
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // --- CORRECCIÓN CLAVE ---
  // La función createClient es asíncrona, por lo que necesita 'await'.
  // Sin 'await', `supabase` es una Promesa, no el cliente, causando el error.
  const supabase = await createClient();

  // Use getUser() instead of getSession() — server-side code should always
  // validate the JWT against Supabase Auth rather than reading an unverified JWT.
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    await supabase.auth.signOut();
  }

  // Redirigimos al usuario a la página de inicio de sesión.
  const redirectUrl = new URL('/login', req.url);
  
  return NextResponse.redirect(redirectUrl, {
    // Usamos el status 302 para una redirección temporal
    status: 302,
  });
}