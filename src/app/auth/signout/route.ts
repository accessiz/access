import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const supabase = createClient();

  // Verificamos si hay una sesión activa
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    // Si hay sesión, la cerramos
    await supabase.auth.signOut();
  }

  // Redirigimos al usuario a la página de inicio de sesión.
  // Es importante usar la URL completa para la redirección desde el servidor.
  const redirectUrl = new URL('/login', req.url);
  
  return NextResponse.redirect(redirectUrl, {
    // Usamos el status 302 para una redirección temporal
    status: 302,
  });
}
