// src/lib/actions/client_actions.ts
'use server'

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { logError } from '@/lib/utils/errors'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Helper para crear el cliente (es el mismo que usas en otros actions)
const createSupabaseServerActionClient = async () => {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {}
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {}
        },
      },
    }
  )
}

/**
 * Esta acción es segura para ser llamada por usuarios anónimos.
 * Llama a la función de base de datos 'client_completes_project'
 * que se ejecuta con 'SECURITY DEFINER' y tiene sus propias reglas de seguridad.
 */
export async function finalizeProjectReview(projectId: string) {
  const supabase = await createSupabaseServerActionClient();

  // Validar que el ID sea un UUID antes de enviarlo
  if (!z.string().uuid().safeParse(projectId).success) {
    return { success: false, error: 'ID de proyecto inválido.' };
  }

  try {
    // 1. Llamar a la función RPC (Remote Procedure Call) segura
    // (Asegúrate de haber corrido el SQL para crear esta función)
    const { error: rpcError } = await supabase.rpc('client_completes_project', {
      project_uuid: projectId
    });

    if (rpcError) {
      logError(rpcError, { action: 'finalizeProjectReview.rpc', projectId });
      return { success: false, error: 'No se pudo finalizar el proyecto.' };
    }

    // 2. Revalidar la página pública
    // (Necesitamos el public_id para esto)
    try {
      // Usamos 'createSupabaseServerActionClient' de nuevo para una lectura segura
      const readClient = await createSupabaseServerActionClient();
      const { data: project } = await readClient.from('projects').select('public_id').eq('id', projectId).single();
      
      if (project?.public_id) {
        revalidatePath(`/c/${project.public_id}`);
      }
    } catch (revalError) {
      logError(revalError, { action: 'finalizeProjectReview.revalidate', projectId });
    }

    return { success: true };
    
  } catch (err) {
    logError(err, { action: 'finalizeProjectReview.catch_all', projectId });
    return { success: false, error: 'Error inesperado al finalizar.' };
  }
}