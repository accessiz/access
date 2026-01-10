// src/lib/actions/client_actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers' // Necesitamos leer cookies
import { z } from 'zod'
import { logError } from '@/lib/utils/errors'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { ActivityTitles } from '@/lib/activity-titles'

// Helper para loguear acciones del cliente (no autenticado)
// Obtiene el user_id del proyecto para saber a quién notificar
async function logClientActivity(params: {
  projectId: string;
  title: string;
  message?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    // Obtener el user_id del proyecto
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('user_id')
      .eq('id', params.projectId)
      .single();

    if (!project?.user_id) return;

    // Insertar en activity_logs con is_urgent=true (para campanita)
    await supabaseAdmin.from('activity_logs').insert({
      user_id: project.user_id,
      category: 'client',
      title: params.title,
      message: params.message || null,
      metadata: params.metadata || null,
      is_urgent: true, // Esto hace que aparezca en la campanita
    });
  } catch (error) {
    console.error('[logClientActivity] Error:', error);
  }
}

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

    // Log activity for notification bell
    await logClientActivity({
      projectId,
      title: `Cliente finalizó el proyecto "${project?.public_id || 'proyecto'}"`,
      metadata: { entity_id: projectId, entity_type: 'project', action: 'finalized' },
    });

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

// --- Acción: Cambiar selección de modelo por el cliente ---
export async function updateClientModelSelection(
  projectId: string,
  modelId: string,
  selection: 'approved' | 'rejected' | 'pending'
) {
  // Validar IDs
  if (!z.string().uuid().safeParse(projectId).success) {
    return { success: false, error: 'ID de proyecto inválido.' };
  }
  if (!z.string().uuid().safeParse(modelId).success) {
    return { success: false, error: 'ID de modelo inválido.' };
  }

  // 🔒 Verificar acceso
  const hasAccess = await verifyAccess(projectId);
  if (!hasAccess) {
    return { success: false, error: 'No tienes autorización.' };
  }

  try {
    const { error } = await supabaseAdmin
      .from('projects_models')
      .update({
        client_selection: selection,
        client_selection_date: new Date().toISOString()
      })
      .eq('project_id', projectId)
      .eq('model_id', modelId);

    if (error) throw error;

    // Get names for the log
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('public_id, project_name, user_id')
      .eq('id', projectId)
      .single();

    const { data: model } = await supabaseAdmin
      .from('models')
      .select('alias')
      .eq('id', modelId)
      .single();

    // Log activity for notification bell (only approved/rejected, not pending)
    if (selection !== 'pending') {
      await logClientActivity({
        projectId,
        title: selection === 'approved'
          ? ActivityTitles.clientApprovedModel(model?.alias || 'Talento', project?.project_name || 'Proyecto')
          : ActivityTitles.clientRejectedModel(model?.alias || 'Talento', project?.project_name || 'Proyecto'),
        metadata: {
          entity_id: modelId,
          entity_type: 'model',
          action: selection === 'approved' ? 'client_approved' : 'client_rejected',
          project_id: projectId
        },
      });
    }

    // Revalidar la página del cliente (usamos project de línea 197)
    if (project?.public_id) {
      revalidatePath(`/c/${project.public_id}`);
    }

    return { success: true };

  } catch (err) {
    logError(err, { action: 'updateClientModelSelection', projectId, modelId });
    return { success: false, error: 'Error al actualizar selección.' };
  }
}
