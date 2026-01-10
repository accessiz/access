'use server'

// --- ¡CAMBIOS IMPORTANTES DE IMPORTACIÓN! ---
// Usamos el nuevo paquete 'ssr' y 'cookies'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
// -------------------------------------------

import { revalidatePath } from "next/cache"
import { z } from 'zod';
import { logError } from '@/lib/utils/errors';
import { PostgrestError } from '@supabase/supabase-js';
import { logActivity } from '@/lib/activity-logger';
import { ActivityTitles } from '@/lib/activity-titles';

// --- Tus helpers de errores (Estos están perfectos) ---
const isPostgrestError = (error: unknown): error is PostgrestError => {
  return typeof error === 'object' && error !== null && 'code' in error;
};

const mapProjectModelDbError = (error: PostgrestError): { message: string } => {
  if (error.code === '23505') {
    return { message: 'Este talento ya ha sido añadido a este proyecto.' };
  }
  if (error.code === '23503') {
    return { message: 'El proyecto o el talento especificado no existe.' };
  }
  return { message: 'Ocurrió un error inesperado en la base de datos al gestionar la relación.' };
};

// --- Función Helper para crear el cliente (LA PARTE CLAVE CORREGIDA) ---
// 1. La función ahora es 'async'
const createSupabaseServerActionClient = async () => {
  // 2. Usamos 'await' para obtener las cookies
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}


// --- Acción: addModelToProject (Actualizada) ---
export async function addModelToProject(projectId: string, modelId: string) {
  // 3. Usamos 'await' al llamar al helper
  const supabase = await createSupabaseServerActionClient();

  if (!z.string().uuid().safeParse(projectId).success || !z.string().uuid().safeParse(modelId).success) {
    return { success: false, error: 'IDs de proyecto o modelo inválidos.' };
  }

  try {
    // 4. Obtener valores por defecto del proyecto y nombres para el log
    const { data: project } = await supabase
      .from('projects')
      .select('default_model_fee, default_fee_type, currency, project_name')
      .eq('id', projectId)
      .single();

    const { data: model } = await supabase
      .from('models')
      .select('alias')
      .eq('id', modelId)
      .single();

    const insertData = {
      project_id: projectId,
      model_id: modelId,
      agreed_fee: project?.default_model_fee || 0,
      fee_type: project?.default_fee_type || 'per_day',
      currency: project?.currency || 'GTQ'
    };

    const { error } = await supabase.from('projects_models').insert(insertData);

    if (error) {
      logError(error, { action: 'addModelToProject', projectId, modelId });
      if (error.code === '23505') { return { success: true }; }
      const { message } = mapProjectModelDbError(error);
      return { success: false, error: message };
    }

    revalidatePath(`/dashboard/projects/${projectId}`);

    // Log activity
    await logActivity({
      category: 'model',
      title: ActivityTitles.modelAddedToProject(
        model?.alias || 'Talento',
        project?.project_name || 'Proyecto'
      ),
      metadata: { entity_id: modelId, entity_type: 'model', action: 'added_to_project', project_id: projectId },
    });

    return { success: true };

  } catch (err) {
    logError(err, { action: 'addModelToProject.catch_all', projectId, modelId });
    if (isPostgrestError(err)) {
      const { message } = mapProjectModelDbError(err);
      return { success: false, error: message };
    }
    return { success: false, error: "No se pudo añadir el talento al proyecto debido a un error inesperado." };
  }
}

// --- Acción: removeModelFromProject (Actualizada) ---
export async function removeModelFromProject(projectId: string, modelId: string) {
  // 3. Usamos 'await' al llamar al helper
  const supabase = await createSupabaseServerActionClient();

  if (!z.string().uuid().safeParse(projectId).success || !z.string().uuid().safeParse(modelId).success) {
    return { success: false, error: 'IDs de proyecto o modelo inválidos.' };
  }

  try {
    // Get names for the log
    const { data: project } = await supabase
      .from('projects')
      .select('project_name')
      .eq('id', projectId)
      .single();

    const { data: model } = await supabase
      .from('models')
      .select('alias')
      .eq('id', modelId)
      .single();

    const { error } = await supabase.from('projects_models').delete().eq('project_id', projectId).eq('model_id', modelId);

    if (error) {
      logError(error, { action: 'removeModelFromProject', projectId, modelId });
      const { message } = mapProjectModelDbError(error);
      return { success: false, error: message };
    }

    revalidatePath(`/dashboard/projects/${projectId}`);

    // Log activity
    await logActivity({
      category: 'model',
      title: ActivityTitles.modelRemovedFromProject(
        model?.alias || 'Talento',
        project?.project_name || 'Proyecto'
      ),
      metadata: { entity_id: modelId, entity_type: 'model', action: 'removed_from_project', project_id: projectId },
    });

    return { success: true };

  } catch (err) {
    logError(err, { action: 'removeModelFromProject.catch_all', projectId, modelId });
    if (isPostgrestError(err)) {
      const { message } = mapProjectModelDbError(err);
      return { success: false, error: message };
    }
    return { success: false, error: "No se pudo quitar el talento del proyecto debido a un error inesperado." };
    // 4. Se eliminó la 'a' que causaba el error en la línea 113
  }
}

// --- Acción: updateModelSelection (Actualizada) ---
export async function updateModelSelection(
  projectId: string,
  modelId: string,
  selection: 'approved' | 'rejected'
) {
  // 3. Usamos 'await' al llamar al helper
  const supabase = await createSupabaseServerActionClient();

  if (!z.string().uuid().safeParse(projectId).success || !z.string().uuid().safeParse(modelId).success) {
    return { success: false, error: 'IDs de proyecto o modelo inválidos.' };
  }
  if (!['approved', 'rejected'].includes(selection)) {
    return { success: false, error: 'Selección inválida.' };
  }

  try {
    const { error } = await supabase
      .from('projects_models')
      .update({
        client_selection: selection,
        client_selection_date: new Date().toISOString()
      })
      .eq('project_id', projectId)
      .eq('model_id', modelId);

    if (error) {
      logError(error, { action: 'updateModelSelection', projectId, modelId, selection });
      const { message } = mapProjectModelDbError(error);
      return { success: false, error: message };
    }

    revalidatePath(`/dashboard/projects/${projectId}`);
    // Revalida la página pública correcta usando public_id
    try {
      const { data: projRow } = await supabase
        .from('projects')
        .select('public_id')
        .eq('id', projectId)
        .single()
      if (projRow?.public_id) {
        revalidatePath(`/c/${projRow.public_id}`)
      }
    } catch { }
    return { success: true };

  } catch (err) {
    logError(err, { action: 'updateModelSelection.catch_all', projectId, modelId, selection });
    if (isPostgrestError(err)) {
      const { message } = mapProjectModelDbError(err);
      return { success: false, error: message };
    }
    return { success: false, error: "No se pudo guardar la selección debido a un error inesperado." };
  }
}

export async function assignModelToSchedule(scheduleId: string, modelId: string, projectId: string) {
  const supabase = await createSupabaseServerActionClient();

  try {
    const { error } = await supabase
      .from('model_assignments')
      .insert({ schedule_id: scheduleId, model_id: modelId });

    if (error) {
      logError(error, { action: 'assignModelToSchedule', scheduleId, modelId });
      return { success: false, error: 'No se pudo asignar el talento.' };
    }

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true };
  } catch (err) {
    logError(err, { action: 'assignModelToSchedule.catch_all', scheduleId, modelId });
    return { success: false, error: 'Error inesperado al asignar.' };
  }
}

export async function unassignModelFromSchedule(scheduleId: string, modelId: string, projectId: string) {
  const supabase = await createSupabaseServerActionClient();

  try {
    const { error } = await supabase
      .from('model_assignments')
      .delete()
      .eq('schedule_id', scheduleId)
      .eq('model_id', modelId);

    if (error) {
      logError(error, { action: 'unassignModelFromSchedule', scheduleId, modelId });
      return { success: false, error: 'No se pudo desasignar el talento.' };
    }

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true };
  } catch (err) {
    logError(err, { action: 'unassignModelFromSchedule.catch_all', scheduleId, modelId });
    return { success: false, error: 'Error inesperado al desasignar.' };
  }
}

// --- Acción: updateModelPaymentDetail (Nueva) ---
export async function updateModelPaymentDetail(
  projectId: string,
  modelId: string,
  data: {
    agreed_fee?: number | null;
    fee_type?: string | null;
    currency?: string | null;
    internal_status?: string | null;
    notes?: string | null;
  }
) {
  const supabase = await createSupabaseServerActionClient();

  if (!z.string().uuid().safeParse(projectId).success || !z.string().uuid().safeParse(modelId).success) {
    return { success: false, error: 'IDs de proyecto o modelo inválidos.' };
  }

  try {
    const { error } = await supabase
      .from('projects_models')
      .update(data)
      .eq('project_id', projectId)
      .eq('model_id', modelId);

    if (error) {
      logError(error, { action: 'updateModelPaymentDetail', projectId, modelId, data });
      return { success: false, error: 'No se pudo actualizar la información de pago.' };
    }

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true };

  } catch (err) {
    logError(err, { action: 'updateModelPaymentDetail.catch_all', projectId, modelId });
    return { success: false, error: "Error inesperado al actualizar el pago." };
  }
}