// src/lib/actions/client_actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers' // Necesitamos leer cookies
import { z } from 'zod'
import { logError } from '@/lib/utils/errors'
import { supabaseAdmin } from '@/lib/supabase/admin'

// --- FUNCIÓN HELPER DE SEGURIDAD ---
async function verifyAccess(projectId: string) {
  // 1. Consultamos si el proyecto tiene contraseña
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('password')
    .eq('id', projectId)
    .single();

  // Si no existe el proyecto, bloqueamos.
  if (!project) return false;

  // 2. Si NO tiene contraseña, es público -> Acceso Permitido.
  if (!project.password) return true;

  // 3. Si TIENE contraseña, verificamos la cookie de acceso.
  const cookieStore = await cookies();
  const accessCookie = cookieStore.get(`project_access_${projectId}`);

  // Si la cookie existe y es válida -> Acceso Permitido.
  return accessCookie?.value === 'true';
}
// -----------------------------------

export async function finalizeProjectReview(projectId: string, rejectPending: boolean = false) {
  if (!z.string().uuid().safeParse(projectId).success) {
    return { success: false, error: 'ID inválido.' };
  }

  // 🔒 EL GUARDIA DE SEGURIDAD
  const hasAccess = await verifyAccess(projectId);
  if (!hasAccess) {
    return { success: false, error: 'No tienes autorización para finalizar este proyecto.' };
  }

  try {
    // AHORA SÍ: Usamos poderes de admin con seguridad
    if (rejectPending) {
      const { error: updateError } = await supabaseAdmin
        .from('projects_models')
        .update({ 
            client_selection: 'rejected',
            client_selection_date: new Date().toISOString()
        })
        .eq('project_id', projectId)
        .or('client_selection.is.null,client_selection.eq.pending');

      if (updateError) throw updateError;
    }

    const statusToSet = 'completed';
    // Registramos la fecha de finalización
    const completionDate = new Date().toISOString(); 

    const { error: finalizeError } = await supabaseAdmin
      .from('projects')
      .update({ status: statusToSet, end_date: completionDate })
      .eq('id', projectId);

    if (finalizeError) throw finalizeError;

    // Revalidar
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('public_id')
      .eq('id', projectId)
      .single();

    if (project?.public_id) revalidatePath(`/c/${project.public_id}`);

    return { success: true };

  } catch (err) {
    logError(err, { action: 'finalizeProjectReview', projectId });
    return { success: false, error: 'Error al procesar la solicitud.' };
  }
}

export async function reopenProject(projectId: string) {
  if (!z.string().uuid().safeParse(projectId).success) {
    return { success: false, error: 'ID inválido.' };
  }

  // 🔒 EL GUARDIA DE SEGURIDAD
  const hasAccess = await verifyAccess(projectId);
  if (!hasAccess) {
    return { success: false, error: 'No tienes autorización para reabrir este proyecto.' };
  }

  try {
    // Al reabrir, el estado vuelve a 'in-review' y quitamos la fecha de finalización
    const { error } = await supabaseAdmin
      .from('projects')
      .update({ status: 'in-review', end_date: null })
      .eq('id', projectId);

    if (error) throw error;

    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('public_id')
      .eq('id', projectId)
      .single();

    if (project?.public_id) revalidatePath(`/c/${project.public_id}`);

    return { success: true };

  } catch (err) {
    logError(err, { action: 'reopenProject', projectId });
    return { success: false, error: 'Error al intentar reabrir.' };
  }
}

    