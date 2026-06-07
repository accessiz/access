// src/lib/actions/client_actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers' // Necesitamos leer cookies
import { z } from 'zod'
import { logError } from '@/lib/utils/errors'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { ActivityTitles } from '@/lib/activity-titles'
import { verifyCookie, getCookieSecret } from '@/lib/utils/cookie-signature'

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
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('user_id')
      .eq('id', params.projectId)
      .single();

    if (projectError) {
      logError(projectError, { action: 'logClientActivity', projectId: params.projectId });
      return;
    }

    if (!project?.user_id) {
      return;
    }

    // Insertar en activity_logs con is_urgent=true (para campanita)
    // Usamos category='project' porque 'client' no está permitido por el CHECK constraint
    const { error: insertError } = await supabaseAdmin.from('activity_logs').insert({
      user_id: project.user_id,
      category: 'project', // Cambiado de 'client' a 'project' por constraint de DB
      title: params.title,
      message: params.message || null,
      metadata: params.metadata ? { ...params.metadata, project_id: params.projectId } : { project_id: params.projectId },
      is_urgent: true, // Esto hace que aparezca en la campanita
    });

    if (insertError) {
      logError(insertError, { action: 'logClientActivity.insert', projectId: params.projectId });
    }
  } catch (error) {
    logError(error, { action: 'logClientActivity.catch_all', projectId: params.projectId });
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

  // If the cookie exists, verify its HMAC signature.
  if (!accessCookie?.value) return false;
  return verifyCookie(accessCookie.value, getCookieSecret());
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

    // Revalidar y obtener detalles para el log y email
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('public_id, project_name, client_name')
      .eq('id', projectId)
      .single();

    if (project?.public_id) revalidatePath(`/c/${project.public_id}`);

    // Log activity for notification bell
    await logClientActivity({
      projectId,
      title: `Cliente finalizó el proyecto "${project?.project_name || 'proyecto'}"`,
      metadata: { entity_id: projectId, entity_type: 'project', action: 'finalized' },
    });

    // Enviar notificación por correo de selección finalizada a scouting
    try {
      const { data: approvedData, error: approvedError } = await supabaseAdmin
        .from('projects_models')
        .select(`
          models:fk_projects_models_model (
            alias,
            full_name,
            gender,
            country,
            birth_country
          )
        `)
        .eq('project_id', projectId)
        .eq('client_selection', 'approved');

      if (approvedError) throw approvedError;

      const approvedModels = (approvedData || [])
        .map((item: any) => {
          const m = item.models;
          if (!m) return null;
          return {
            alias: m.alias || m.full_name || 'Sin Alias',
            fullName: m.full_name || m.alias || 'Sin Nombre',
            gender: m.gender || 'Unknown',
            country: m.country || m.birth_country || 'Sin Nacionalidad',
          };
        })
        .filter((m): m is Exclude<typeof m, null> => m !== null);

      const { sendProjectCompletionEmail } = await import('@/lib/services/resend');
      await sendProjectCompletionEmail({
        projectName: project?.project_name || 'Proyecto',
        clientName: project?.client_name || 'Cliente',
        publicId: project?.public_id || projectId,
        approvedModels,
      });
    } catch (emailErr) {
      logError(emailErr, { action: 'finalizeProjectReview.sendEmail', projectId });
    }

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
      .select('public_id, project_name')
      .eq('id', projectId)
      .single();

    if (project?.public_id) revalidatePath(`/c/${project.public_id}`);

    // Log activity for notification bell
    await logClientActivity({
      projectId,
      title: ActivityTitles.clientReopenedProject(project?.project_name || 'proyecto'),
      metadata: { entity_id: projectId, entity_type: 'project', action: 'reopened' },
    });

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
    // Consultar selección previa para detallar el log
    const { data: previousRelation } = await supabaseAdmin
      .from('projects_models')
      .select('client_selection')
      .eq('project_id', projectId)
      .eq('model_id', modelId)
      .maybeSingle();

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

    const prevSel = previousRelation?.client_selection;
    const displayName = model?.alias || 'Talento';
    let logTitle = '';

    if (selection === 'approved') {
      if (prevSel === 'rejected') {
        logTitle = `Cliente aprobó a ${displayName} (a quien había rechazado anteriormente)`;
      } else {
        logTitle = `Cliente aprobó a ${displayName}`;
      }
    } else if (selection === 'rejected') {
      if (prevSel === 'approved') {
        logTitle = `Cliente eliminó a ${displayName} de los aprobados`;
      } else {
        logTitle = `Cliente rechazó a ${displayName}`;
      }
    } else { // pending
      if (prevSel === 'approved') {
        logTitle = `Cliente quitó aprobación a ${displayName}`;
      } else if (prevSel === 'rejected') {
        logTitle = `Cliente quitó rechazo a ${displayName}`;
      }
    }

    if (logTitle) {
      await logClientActivity({
        projectId,
        title: logTitle,
        metadata: {
          entity_id: modelId,
          entity_type: 'model',
          action: `client_${selection}`,
        },
      });
    }

    // Revalidar la página del cliente
    if (project?.public_id) {
      revalidatePath(`/c/${project.public_id}`);
    }

    return { success: true };

  } catch (err) {
    logError(err, { action: 'updateClientModelSelection', projectId, modelId });
    return { success: false, error: 'Error al actualizar selección.' };
  }
}

// --- Acción: Marcar proyecto como "in-review" cuando el cliente lo abre ---
export async function markProjectInReview(projectId: string) {
  if (!z.string().uuid().safeParse(projectId).success) {
    return { success: false, error: 'ID inválido.' };
  }

  // 🔒 Verificar acceso (cookie HMAC o proyecto público)
  const hasAccess = await verifyAccess(projectId);
  if (!hasAccess) {
    return { success: false, error: 'No tienes autorización.' };
  }

  try {
    // Solo actualizar si el proyecto está en estado 'sent'
    // Esto evita sobrescribir otros estados válidos
    const { data: project, error: fetchError } = await supabaseAdmin
      .from('projects')
      .select('id, status, start_date, public_id, project_name')
      .eq('id', projectId)
      .single();

    if (fetchError || !project) {
      return { success: false, error: 'Proyecto no encontrado.' };
    }

    // Solo cambiar a in-review si está en 'sent'
    if (project.status !== 'sent') {
      return { success: true }; // No es un error, simplemente no hay nada que hacer
    }

    const updatePayload: Record<string, unknown> = { status: 'in-review' };

    // Registrar start_date si no existe
    if (!project.start_date) {
      updatePayload.start_date = new Date().toISOString();
    }

    const { error } = await supabaseAdmin
      .from('projects')
      .update(updatePayload)
      .eq('id', projectId);

    if (error) throw error;

    if (project.public_id) {
      revalidatePath(`/c/${project.public_id}`);
    }
    revalidatePath(`/dashboard/projects/${projectId}`);
    revalidatePath('/dashboard/projects');

    // Log activity for notification bell
    await logClientActivity({
      projectId,
      title: `Cliente abrió el proyecto "${project.project_name || 'proyecto'}"`,
      metadata: { entity_id: projectId, entity_type: 'project', action: 'started_review' },
    });

    return { success: true };

  } catch (err) {
    logError(err, { action: 'markProjectInReview', projectId });
    return { success: false, error: 'Error al actualizar estado.' };
  }
}
