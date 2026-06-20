import { supabaseAdmin } from '@/lib/supabase/admin';
import { getGuatemalaToday } from '@/lib/constants/finance';
import { revalidatePath } from 'next/cache';
import { logError } from '@/lib/utils/errors';

export async function autoCloseAllExpiredProjects(): Promise<{
  success: boolean;
  closedCount: number;
  closedIds: string[];
  error?: string;
}> {
  try {
    // 1. Fetch all projects that are not completed or archived
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select('id, status, schedule, public_id')
      .not('status', 'in', '("completed","archived")');

    if (projectsError) {
      logError(projectsError, { action: 'autoCloseAllExpiredProjects.fetchProjects' });
      return { success: false, closedCount: 0, closedIds: [], error: projectsError.message };
    }

    if (!projects || projects.length === 0) {
      return { success: true, closedCount: 0, closedIds: [] };
    }

    const today = getGuatemalaToday();
    const closedIds: string[] = [];

    // 2. Loop through projects to check schedule expiration
    for (const project of projects) {
      const schedule = project.schedule as { date: string }[] | null;
      if (!schedule || schedule.length === 0) {
        continue;
      }

      // Parse schedule dates to local midnight (Guatemala time)
      const dates = schedule.map(s => new Date(s.date + 'T23:59:59'));
      const lastDate = new Date(Math.max(...dates.map(d => d.getTime())));

      // If today is strictly past the last date of the schedule, close it
      if (today > lastDate) {
        // Set all pending model selections to rejected for this project
        const { error: updateModelsError } = await supabaseAdmin
          .from('projects_models')
          .update({ client_selection: 'rejected' })
          .eq('project_id', project.id)
          .eq('client_selection', 'pending');

        if (updateModelsError) {
          logError(updateModelsError, { action: 'autoCloseAllExpiredProjects.updateModels', projectId: project.id });
        }

        // Set project status to completed
        const { error: updateProjectError } = await supabaseAdmin
          .from('projects')
          .update({
            status: 'completed',
            end_date: new Date().toISOString()
          })
          .eq('id', project.id);

        if (updateProjectError) {
          logError(updateProjectError, { action: 'autoCloseAllExpiredProjects.updateProject', projectId: project.id });
          continue; // Move to next project if update failed
        }

        closedIds.push(project.id);

        // Enviar notificación por correo de selección finalizada a scouting
        try {
          const { sendProjectCompletionEmailByProjectId } = await import('@/lib/services/resend');
          await sendProjectCompletionEmailByProjectId(project.id);
        } catch (emailErr) {
          logError(emailErr, { action: 'autoCloseAllExpiredProjects.sendEmail', projectId: project.id });
        }

        // Revalidate Next.js cache for this specific project
        try {
          if (project.public_id) {
            revalidatePath(`/c/${project.public_id}`);
          }
          revalidatePath(`/dashboard/projects/${project.id}`);
        } catch (revalidateErr) {
          console.error(`[autoCloseAllExpiredProjects] Revalidation error for project ${project.id}:`, revalidateErr);
        }
      }
    }

    // Revalidate list path if any project was closed
    if (closedIds.length > 0) {
      try {
        revalidatePath('/dashboard/projects');
      } catch (revalidateErr) {
        console.error('[autoCloseAllExpiredProjects] Revalidation error for project list:', revalidateErr);
      }
    }

    return {
      success: true,
      closedCount: closedIds.length,
      closedIds
    };
  } catch (err) {
    logError(err, { action: 'autoCloseAllExpiredProjects.catch_all' });
    return {
      success: false,
      closedCount: 0,
      closedIds: [],
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
}
