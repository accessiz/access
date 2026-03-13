'use server'

import { revalidatePath } from 'next/cache'
import { logError } from '@/lib/utils/errors'
import type { ProjectStatus } from '@/lib/types'
import { createSupabaseServerActionClient } from '@/lib/supabase/server-action'

// ─────────────────────────────────────────────
// completeProjectReview
// ─────────────────────────────────────────────

export async function completeProjectReview(projectId: string) {
  const supabase = await createSupabaseServerActionClient()

  // ─── Auth guard ───
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Usuario no autenticado.' }
  }

  const statusToSet: ProjectStatus = 'completed'

  try {
    const { error } = await supabase
      .from('projects')
      .update({
        status: statusToSet,
        end_date: new Date().toISOString(),
      })
      .eq('id', projectId)

    if (error) {
      logError(error, { action: 'completeProjectReview', projectId })
      return {
        success: false,
        error: 'No se pudo actualizar el estado del proyecto.',
      }
    }

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
    revalidatePath(`/dashboard/projects/${projectId}`)
    return { success: true }
  } catch (err) {
    logError(err, { action: 'completeProjectReview.catch_all', projectId })
    return { success: false, error: 'Error inesperado al completar la revisión.' }
  }
}

// ─────────────────────────────────────────────
// updateProjectStatus
// ─────────────────────────────────────────────

export async function updateProjectStatus(
  projectId: string,
  status: ProjectStatus,
  setStartDate: boolean = false
) {
  const supabase = await createSupabaseServerActionClient()

  // ─── Auth guard ───
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Usuario no autenticado.' }
  }

  try {
    const { data: projRow, error: fetchErr } = await supabase
      .from('projects')
      .select('public_id, start_date')
      .eq('id', projectId)
      .single()

    if (fetchErr) {
      logError(fetchErr, { action: 'updateProjectStatus.fetch_public_id', projectId, status })
    }

    const updatePayload: Record<string, unknown> = { status }

    if (setStartDate && !projRow?.start_date) {
      updatePayload.start_date = new Date().toISOString();
    }

    if (status === 'completed') {
      updatePayload.end_date = new Date().toISOString();
    }

    const { error } = await supabase
      .from('projects')
      .update(updatePayload)
      .eq('id', projectId)

    if (error) {
      logError(error, { action: 'updateProjectStatus', projectId, status })
      return { success: false, error: 'No se pudo actualizar el estado del proyecto.' }
    }

    if (projRow?.public_id) {
      revalidatePath(`/c/${projRow.public_id}`)
    }
    revalidatePath(`/dashboard/projects/${projectId}`)
    revalidatePath('/dashboard/projects')
    return { success: true }
  } catch (err) {
    logError(err, { action: 'updateProjectStatus.catch_all', projectId, status })
    return { success: false, error: 'Error inesperado al actualizar el estado.' }
  }
}

// ─────────────────────────────────────────────
// autoCloseExpiredProject
// ─────────────────────────────────────────────

/**
 * Auto-closes a project if its last schedule date has passed.
 * Pending model selections → rejected; project status → completed.
 */
export async function autoCloseExpiredProject(projectId: string): Promise<{ closed: boolean; error?: string }> {
  const supabase = await createSupabaseServerActionClient();

  // ─── Auth guard ───
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { closed: false, error: 'Usuario no autenticado.' }
  }

  try {
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, status, schedule')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return { closed: false, error: 'Proyecto no encontrado.' };
    }

    if (project.status === 'completed' || project.status === 'archived') {
      return { closed: false };
    }

    const schedule = project.schedule as { date: string }[] | null;
    if (!schedule || schedule.length === 0) {
      return { closed: false };
    }

    const dates = schedule.map(s => new Date(s.date + 'T23:59:59'));
    const lastDate = new Date(Math.max(...dates.map(d => d.getTime())));

    const { getGuatemalaToday } = await import('@/lib/constants/finance');
    const now = getGuatemalaToday();
    if (now <= lastDate) {
      return { closed: false };
    }

    const { error: updateModelsError } = await supabase
      .from('projects_models')
      .update({ client_selection: 'rejected' })
      .eq('project_id', projectId)
      .eq('client_selection', 'pending');

    if (updateModelsError) {
      logError(updateModelsError, { action: 'autoCloseExpiredProject.updateModels', projectId });
    }

    const { error: updateProjectError } = await supabase
      .from('projects')
      .update({ status: 'completed' })
      .eq('id', projectId);

    if (updateProjectError) {
      logError(updateProjectError, { action: 'autoCloseExpiredProject.updateProject', projectId });
      return { closed: false, error: 'Error al actualizar el estado del proyecto.' };
    }

    revalidatePath(`/dashboard/projects/${projectId}`);
    revalidatePath('/dashboard/projects');

    return { closed: true };

  } catch (err) {
    logError(err, { action: 'autoCloseExpiredProject.catch_all', projectId });
    return { closed: false, error: 'Error inesperado.' };
  }
}
