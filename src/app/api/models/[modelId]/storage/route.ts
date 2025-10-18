import { createClient } from '@/lib/supabase/server';
import { type NextRequest, NextResponse } from 'next/server';

// Forzar el runtime de Node.js para asegurar la compatibilidad con las APIs de Supabase.
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1. Inicializa el cliente de Supabase para el servidor, esperando el resultado.
    const supabase = await createClient();

    // 2. Verifica si hay un usuario autenticado del lado del servidor.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 3. Si hay un usuario, cierra su sesión.
    if (user) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error during sign out:', error);
        // Si hay un error al cerrar sesión, puedes optar por devolver un error
        // o redirigir de todas formas. Redirigir suele ser más seguro.
      }
    }

    // 4. Redirige al usuario a la página de inicio de sesión.
    // Esta es la forma más robusta de asegurar que el estado del cliente se actualice.
    return NextResponse.redirect(new URL('/login', request.url), {
      status: 302,
    });
    
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    console.error('Unexpected error in signout route:', error);
    // En caso de un error inesperado, también es buena idea redirigir
    // para evitar que el usuario se quede en un estado inconsistente.
    return NextResponse.redirect(new URL('/login?error=Could not sign out', request.url), {
      status: 302,
    });
  }
}
