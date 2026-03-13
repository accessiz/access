'use server'

import { revalidatePath } from 'next/cache'
import { logError } from '@/lib/utils/errors'
import { createSupabaseServerActionClient } from '@/lib/supabase/server-action'

import {
  type ScheduleAnalysis,
  type ScheduleChange,
  type MigrationMapping,
  type MigrationOption,
  convertToTimestamp,
  timestampTo12h,
  extractDateFromTimestamp,
} from './helpers'

// ─────────────────────────────────────────────
// analyzeScheduleChanges
// ─────────────────────────────────────────────

export async function analyzeScheduleChanges(
  projectId: string,
  newSchedule: { date: string; startTime: string; endTime: string }[]
): Promise<{ success: boolean; analysis?: ScheduleAnalysis; error?: string }> {
  const supabase = await createSupabaseServerActionClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Usuario no autenticado.' };
  }

  try {
    const { data: existingSchedules, error: scheduleError } = await supabase
      .from('project_schedule')
      .select(`
        id,
        start_time,
        end_time,
        model_assignments(id)
      `)
      .eq('project_id', projectId);

    if (scheduleError) {
      return { success: false, error: 'Error al obtener horarios existentes.' };
    }

    const changes: ScheduleChange[] = [];

    const existingMap = new Map<string, {
      id: string;
      date: string;
      startTime: string;
      endTime: string;
      assignmentCount: number;
    }>();

    (existingSchedules || []).forEach(s => {
      const date = extractDateFromTimestamp(s.start_time);
      const startTime = timestampTo12h(s.start_time);
      const endTime = timestampTo12h(s.end_time);
      const key = `${date}-${startTime}-${endTime}`;
      existingMap.set(key, {
        id: s.id,
        date,
        startTime,
        endTime,
        assignmentCount: s.model_assignments?.length || 0,
      });
    });

    const newMap = new Map<string, {
      date: string;
      startTime: string;
      endTime: string;
    }>();

    newSchedule.forEach(s => {
      const key = `${s.date}-${s.startTime}-${s.endTime}`;
      newMap.set(key, s);
    });

    existingMap.forEach((existing, key) => {
      if (!newMap.has(key)) {
        changes.push({
          type: 'removed',
          oldScheduleId: existing.id,
          oldDate: existing.date,
          oldStartTime: existing.startTime,
          oldEndTime: existing.endTime,
          assignmentCount: existing.assignmentCount,
        });
      }
    });

    newMap.forEach((newItem, key) => {
      if (!existingMap.has(key)) {
        changes.push({
          type: 'added',
          newDate: newItem.date,
          newStartTime: newItem.startTime,
          newEndTime: newItem.endTime,
        });
      }
    });

    const totalAffectedAssignments = changes
      .filter(c => c.type === 'removed')
      .reduce((sum, c) => sum + (c.assignmentCount || 0), 0);

    const newSchedulesForMapping = newSchedule.map(s => ({
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
    }));

    return {
      success: true,
      analysis: {
        hasChanges: changes.length > 0,
        hasAffectedAssignments: totalAffectedAssignments > 0,
        changes,
        totalAffectedAssignments,
        newSchedules: newSchedulesForMapping,
      },
    };
  } catch (err) {
    logError(err, { action: 'analyzeScheduleChanges', projectId });
    return { success: false, error: 'Error al analizar cambios.' };
  }
}

// ─────────────────────────────────────────────
// syncProjectSchedule
// ─────────────────────────────────────────────

export async function syncProjectSchedule(projectId: string) {
  const supabase = await createSupabaseServerActionClient();

  // ─── Auth guard ───
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Usuario no autenticado.' }
  }

  try {
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('project_name, schedule')
      .eq('id', projectId)
      .single();

    if (fetchError || !project) return { success: false, error: 'Proyecto no encontrado.' };

    interface LegacyScheduleItem {
      date: string;
      startTime: string;
      endTime: string;
    }

    const schedule = project.schedule as LegacyScheduleItem[] | null;
    if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
      return { success: true, message: 'No hay horarios que sincronizar.' };
    }

    const { data: existingSchedules } = await supabase
      .from('project_schedule')
      .select('id')
      .eq('project_id', projectId);

    if (existingSchedules && existingSchedules.length > 0) {
      return { success: true, message: 'El proyecto ya está sincronizado.' };
    }

    const schedulePayload = schedule.map(item => ({
      project_id: projectId,
      title: project.project_name,
      start_time: convertToTimestamp(item.date, item.startTime),
      end_time: convertToTimestamp(item.date, item.endTime),
      is_call_time: false
    }));

    const { error: insertError } = await supabase
      .from('project_schedule')
      .insert(schedulePayload);

    if (insertError) {
      logError(insertError, { action: 'syncProjectSchedule.insert', projectId });
      return { success: false, error: 'Error al insertar los horarios.' };
    }

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true };
  } catch (err) {
    logError(err, { action: 'syncProjectSchedule.catch_all', projectId });
    return { success: false, error: 'Error inesperado al sincronizar.' };
  }
}

// ─────────────────────────────────────────────
// handleOrphanedAssignments
// ─────────────────────────────────────────────

export async function handleOrphanedAssignments(
  projectId: string,
  action: MigrationOption
): Promise<{ success: boolean; migratedCount?: number; deletedCount?: number; error?: string }> {
  const supabase = await createSupabaseServerActionClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Usuario no autenticado.' };
  }

  try {
    if (action === 'keep') {
      return { success: true, migratedCount: 0, deletedCount: 0 };
    }

    if (action === 'delete') {
      const { count, error } = await supabase
        .from('model_assignments')
        .delete({ count: 'exact' })
        .eq('project_id', projectId)
        .is('schedule_id', null);

      if (error) {
        logError(error, { action: 'handleOrphanedAssignments.delete', projectId });
        return { success: false, error: 'Error al eliminar asignaciones.' };
      }

      revalidatePath(`/dashboard/projects/${projectId}`);
      return { success: true, deletedCount: count || 0 };
    }

    if (action === 'migrate') {
      const { data: orphanedAssignments, error: fetchError } = await supabase
        .from('model_assignments')
        .select('id, model_id, created_at')
        .eq('project_id', projectId)
        .is('schedule_id', null);

      if (fetchError) {
        logError(fetchError, { action: 'handleOrphanedAssignments.fetch', projectId });
        return { success: false, error: 'Error al obtener asignaciones huérfanas.' };
      }

      if (!orphanedAssignments || orphanedAssignments.length === 0) {
        return { success: true, migratedCount: 0 };
      }

      const { data: availableSchedules, error: schedulesError } = await supabase
        .from('project_schedule')
        .select('id, start_time')
        .eq('project_id', projectId)
        .order('start_time', { ascending: true });

      if (schedulesError || !availableSchedules || availableSchedules.length === 0) {
        return { success: true, migratedCount: 0 };
      }

      const firstScheduleId = availableSchedules[0].id;
      let migratedCount = 0;

      for (const assignment of orphanedAssignments) {
        const { data: existing } = await supabase
          .from('model_assignments')
          .select('id')
          .eq('model_id', assignment.model_id)
          .eq('schedule_id', firstScheduleId)
          .maybeSingle();

        if (!existing) {
          const { error: updateError } = await supabase
            .from('model_assignments')
            .update({ schedule_id: firstScheduleId })
            .eq('id', assignment.id);

          if (!updateError) {
            migratedCount++;
          }
        }
      }

      revalidatePath(`/dashboard/projects/${projectId}`);
      return { success: true, migratedCount };
    }

    return { success: false, error: 'Acción no válida.' };

  } catch (err) {
    logError(err, { action: 'handleOrphanedAssignments.catch_all', projectId });
    return { success: false, error: 'Error inesperado.' };
  }
}

// ─────────────────────────────────────────────
// getOrphanedAssignments
// ─────────────────────────────────────────────

export async function getOrphanedAssignments(
  projectId: string
): Promise<{ success: boolean; count?: number; assignments?: { id: string; modelId: string; modelAlias: string }[]; error?: string }> {
  const supabase = await createSupabaseServerActionClient();

  // ─── Auth guard ───
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Usuario no autenticado.' }
  }

  try {
    const { data, error, count } = await supabase
      .from('model_assignments')
      .select(`
        id,
        model_id,
        models!inner(alias)
      `, { count: 'exact' })
      .eq('project_id', projectId)
      .is('schedule_id', null);

    if (error) {
      logError(error, { action: 'getOrphanedAssignments', projectId });
      return { success: false, error: 'Error al obtener asignaciones huérfanas.' };
    }

    interface OrphanedAssignmentRow {
      id: string;
      model_id: string;
      models: { alias: string } | null;
    }

    const assignments = ((data || []) as unknown as OrphanedAssignmentRow[]).map((a) => ({
      id: a.id,
      modelId: a.model_id,
      modelAlias: a.models?.alias || 'Modelo',
    }));

    return { success: true, count: count || 0, assignments };

  } catch (err) {
    logError(err, { action: 'getOrphanedAssignments.catch_all', projectId });
    return { success: false, error: 'Error inesperado.' };
  }
}

// ─────────────────────────────────────────────
// applyMigrationMapping
// ─────────────────────────────────────────────

export async function applyMigrationMapping(
  projectId: string,
  mapping: MigrationMapping,
  newSchedule: { date: string; startTime: string; endTime: string }[]
): Promise<{ success: boolean; migratedCount?: number; deletedCount?: number; keptCount?: number; error?: string }> {
  const supabase = await createSupabaseServerActionClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Usuario no autenticado.' };
  }

  try {
    let migratedCount = 0;
    let deletedCount = 0;
    let keptCount = 0;

    for (const [oldScheduleId, destination] of Object.entries(mapping)) {
      if (!oldScheduleId) continue;

      const { data: assignments, error: fetchError } = await supabase
        .from('model_assignments')
        .select('id, model_id')
        .eq('schedule_id', oldScheduleId);

      if (fetchError) {
        logError(fetchError, { action: 'applyMigrationMapping.fetch', oldScheduleId });
        continue;
      }

      if (!assignments || assignments.length === 0) {
        continue;
      }

      if (destination === 'delete') {
        const { error: deleteError } = await supabase
          .from('model_assignments')
          .delete()
          .eq('schedule_id', oldScheduleId);

        if (deleteError) {
          logError(deleteError, { action: 'applyMigrationMapping.delete', oldScheduleId });
        } else {
          deletedCount += assignments.length;
        }
      } else if (destination === 'none') {
        const { error: updateError } = await supabase
          .from('model_assignments')
          .update({ schedule_id: null })
          .eq('schedule_id', oldScheduleId);

        if (updateError) {
          logError(updateError, { action: 'applyMigrationMapping.unassign', oldScheduleId });
        } else {
          keptCount += assignments.length;
        }
      } else {
        let targetDate: string;
        let targetStartTime: string | undefined;

        if (destination.includes('|')) {
          const [date, startTime] = destination.split('|');
          targetDate = date;
          targetStartTime = startTime;
        } else {
          targetDate = destination;
        }

        const targetScheduleData = newSchedule.find(s =>
          s.date === targetDate && (targetStartTime ? s.startTime === targetStartTime : true)
        );

        if (!targetScheduleData) {
          logError(`No schedule found for date ${targetDate}`, { action: 'applyMigrationMapping.findSchedule', targetDate });
          continue;
        }

        const startTimestamp = convertToTimestamp(targetScheduleData.date, targetScheduleData.startTime);
        const endTimestamp = convertToTimestamp(targetScheduleData.date, targetScheduleData.endTime);

        const { data: existingSchedule } = await supabase
          .from('project_schedule')
          .select('id')
          .eq('project_id', projectId)
          .eq('start_time', startTimestamp)
          .maybeSingle();

        let targetScheduleId = existingSchedule?.id;

        if (!targetScheduleId) {
          const { data: newScheduleRecord, error: createError } = await supabase
            .from('project_schedule')
            .insert({
              project_id: projectId,
              start_time: startTimestamp,
              end_time: endTimestamp,
            })
            .select('id')
            .single();

          if (createError || !newScheduleRecord) {
            logError(createError, { action: 'applyMigrationMapping.create', projectId });
            continue;
          }
          targetScheduleId = newScheduleRecord.id;
        }

        for (const assignment of assignments) {
          const { data: existing } = await supabase
            .from('model_assignments')
            .select('id')
            .eq('model_id', assignment.model_id)
            .eq('schedule_id', targetScheduleId)
            .maybeSingle();

          if (!existing) {
            const { error: updateError } = await supabase
              .from('model_assignments')
              .update({ schedule_id: targetScheduleId })
              .eq('id', assignment.id);

            if (!updateError) {
              migratedCount++;
            }
          } else {
            await supabase
              .from('model_assignments')
              .delete()
              .eq('id', assignment.id);
          }
        }
      }
    }

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, migratedCount, deletedCount, keptCount };

  } catch (err) {
    logError(err, { action: 'applyMigrationMapping.catch_all', projectId });
    return { success: false, error: 'Error inesperado al migrar asignaciones.' };
  }
}
