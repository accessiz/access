import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs'; // Necesario para Supabase (evita errores de Edge Runtime)

export async function POST() {
  try {
    // Await para resolver Promise<SupabaseClient>
    const supabase = await createClient();
    
    // Usar getUser() para verificar autenticación (más seguro para server-side)
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      // No hay usuario autenticado, no hay sesión que cerrar
      return NextResponse.json({ message: 'No hay sesión activa.' }, { status: 200 });
    }
    
    // Cerrar la sesión
    const { error: signOutError } = await supabase.auth.signOut();
    
    if (signOutError) {
      console.error('Error al cerrar sesión:', signOutError);
      return NextResponse.json(
        { error: 'Error al cerrar sesión: ' + signOutError.message },
        { status: 500 }
      );
    }
    
    // Crear respuesta y limpiar cookies de autenticación
    const response = NextResponse.json({ message: 'Sesión cerrada correctamente.' });
    
    // Eliminar cookies de Supabase (ajusta nombres según tu configuración)
    response.cookies.delete('sb-access-token');
    response.cookies.delete('sb-refresh-token');
    
    return response;
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Error desconocido');
    console.error('Error inesperado en signout:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}