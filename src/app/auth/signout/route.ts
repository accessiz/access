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

  // Verificamos si hay una sesión activa
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    // Si hay sesión, la cerramos
    await supabase.auth.signOut();
  }

  // Redirigimos al usuario a la página de inicio de sesión.
  const redirectUrl = new URL('/login', req.url);
  
  return NextResponse.redirect(redirectUrl, {
    // Usamos el status 302 para una redirección temporal
    status: 302,
  });
}