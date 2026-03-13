'use server'

import { revalidatePath } from 'next/cache'
// Eliminada importación de hash de bcryptjs


import { logError } from '@/lib/utils/errors'
import { projectFormSchema } from '@/lib/schemas/projects'
import { logActivity } from '@/lib/activity-logger'
import { ActivityTitles } from '@/lib/activity-titles'
import { createSupabaseServerActionClient } from '@/lib/supabase/server-action'

import {
  type ActionState,
  type FormDataScheduleEntry,
  type MigrationMapping,
  convertToTimestamp,
  timestampTo12h,
  extractDateFromTimestamp,
  extractScheduleFromFormData,
  extractProjectTypesFromFormData,
  buildRawProjectData,
  formatZodErrors,
} from './helpers'

// ─────────────────────────────────────────────
// Shared constants
// ─────────────────────────────────────────────

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Validates a string is a well-formed UUID v4. */
function assertUUID(id: string, label = 'ID'): ActionState | null {
  if (!id || !UUID_REGEX.test(id)) {
    return { success: false, error: `${label} inválido.` };
  }
  return null;
}

// ─────────────────────────────────────────────
// createProject
// ─────────────────────────────────────────────

export async function createProject(
  _prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createSupabaseServerActionClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Usuario no autenticado.' };
  }

  // Extract and validate form data
  const scheduleEntries = extractScheduleFromFormData(formData);
  const projectTypesEntries = extractProjectTypesFromFormData(formData);
  const rawData = buildRawProjectData(formData, scheduleEntries, projectTypesEntries);

  const parsed = projectFormSchema.safeParse(rawData);

  if (!parsed.success) {
    const errorMessages = formatZodErrors(parsed.error.issues, rawData.schedule as FormDataScheduleEntry[]);
    return {
      success: false,
      error: Object.values(errorMessages)[0] || 'Campos inválidos.',
      errors: errorMessages,
    };
  }

  const { password, ...restOfData } = parsed.data;

  try {
    // Se guarda la contraseña en texto plano para que sea visible al compartir
    const projectPassword = password || null;
    const schedule = (parsed.data.schedule && parsed.data.schedule.length > 0) ? parsed.data.schedule : null;

    const insertPayload = {
      ...restOfData,
      password: projectPassword,
      schedule,
      status: 'draft' as const,
      user_id: user.id,
    };

    const { data: newProject, error } = await supabase
      .from('projects')
      .insert(insertPayload)
      .select('id')
      .single();

    if (error) {
      logError(error, { action: 'createProject' });
      return { success: false, error: 'Error en la base de datos (Project).' };
    }

    if (schedule && schedule.length > 0) {
      const schedulePayload = schedule.map(item => ({
        project_id: newProject.id,
        title: parsed.data.project_name,
        start_time: convertToTimestamp(item.date, item.startTime),
        end_time: convertToTimestamp(item.date, item.endTime),
        is_call_time: false
      }));

      const { error: scheduleError } = await supabase
        .from('project_schedule')
        .insert(schedulePayload);

      if (scheduleError) {
        logError(scheduleError, { action: 'createProject.schedule_insert', projectId: newProject.id });
        // Roll back the project since schedule is critical data
        await supabase.from('projects').delete().eq('id', newProject.id);
        return { success: false, error: 'Error al guardar los horarios del proyecto.' };
      }
    }

    revalidatePath('/dashboard/projects');

    await logActivity({
      category: 'project',
      title: ActivityTitles.projectCreated(parsed.data.project_name || 'Nuevo Proyecto'),
      metadata: { entity_id: newProject.id, entity_type: 'project', action: 'created' },
    });

    return { success: true, projectId: newProject.id };

  } catch (err) {
    logError(err, { action: 'createProject.catch_all' });
    return { success: false, error: 'Error inesperado al crear el proyecto.' };
  }
}

// ─────────────────────────────────────────────
// updateProject
// ─────────────────────────────────────────────

export async function updateProject(
  projectId: string,
  _prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const uuidError = assertUUID(projectId, 'ID de proyecto');
  if (uuidError) return uuidError;

  const supabase = await createSupabaseServerActionClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Usuario no autenticado.' };
  }

  const { data: currentProject, error: ownerError } = await supabase
    .from('projects')
    .select('user_id, default_model_fee, default_fee_type, currency, default_model_trade_fee')
    .eq('id', projectId)
    .single();

  if (ownerError || currentProject?.user_id !== user.id) {
    return { success: false, error: 'No tienes permiso para editar este proyecto.' };
  }

  // Extract and validate form data
  const scheduleEntries = extractScheduleFromFormData(formData);
  const projectTypesEntries = extractProjectTypesFromFormData(formData);

  const migrationMappingStr = formData.get('migrationMapping') as string | null;
  let migrationMapping: MigrationMapping | null = null;
  if (migrationMappingStr) {
    try {
      migrationMapping = JSON.parse(migrationMappingStr);
    } catch (e) {
      logError(e, { action: 'updateProject.parseMigrationMapping' });
    }
  }

  const rawData = buildRawProjectData(formData, scheduleEntries, projectTypesEntries);

  const parsed = projectFormSchema.safeParse(rawData);

  if (!parsed.success) {
    const errorMessages = formatZodErrors(parsed.error.issues, rawData.schedule as FormDataScheduleEntry[]);
    return {
      success: false,
      error: Object.values(errorMessages)[0] || 'Campos inválidos.',
      errors: errorMessages,
    };
  }

  const { password, ...restOfData } = parsed.data;

  try {
    const schedule = (parsed.data.schedule && parsed.data.schedule.length > 0) ? parsed.data.schedule : null;

    const updatePayload: Record<string, unknown> = {
      ...restOfData,
      schedule,
    };

    // Se guarda en texto plano a petición del usuario
    if (password && password.length > 0) {
      updatePayload.password = password;
    }

    const { error } = await supabase
      .from('projects')
      .update(updatePayload)
      .eq('id', projectId);

    if (error) {
      logError(error, { action: 'updateProject' });
      return { success: false, error: 'Error al actualizar en la base de datos.' };
    }

    // SMART SCHEDULE UPDATE — compare and only modify what changed

    const { data: existingSchedules } = await supabase
      .from('project_schedule')
      .select('id, start_time, end_time')
      .eq('project_id', projectId);

    const existingMap = new Map<string, string>();
    (existingSchedules || []).forEach(s => {
      const date = extractDateFromTimestamp(s.start_time);
      const startTime = timestampTo12h(s.start_time);
      const endTime = timestampTo12h(s.end_time);
      const key = `${date}-${startTime}-${endTime}`;
      existingMap.set(key, s.id);
    });

    const newScheduleKeys = new Set<string>();
    const schedulesToInsert: {
      project_id: string;
      title: string;
      start_time: string;
      end_time: string;
      is_call_time: boolean;
    }[] = [];

    if (schedule && schedule.length > 0) {
      schedule.forEach(item => {
        const key = `${item.date}-${item.startTime}-${item.endTime}`;
        newScheduleKeys.add(key);

        if (!existingMap.has(key)) {
          schedulesToInsert.push({
            project_id: projectId,
            title: parsed.data.project_name || 'Horario',
            start_time: convertToTimestamp(item.date, item.startTime),
            end_time: convertToTimestamp(item.date, item.endTime),
            is_call_time: false
          });
        }
      });
    }

    const scheduleIdsToDelete: string[] = [];
    existingMap.forEach((id, key) => {
      if (!newScheduleKeys.has(key)) {
        scheduleIdsToDelete.push(id);
      }
    });

    // STEP 1: Insert new schedules first
    if (schedulesToInsert.length > 0) {
      await supabase
        .from('project_schedule')
        .insert(schedulesToInsert);
    }

    // STEP 2: Apply migration mapping before deleting old schedules
    if (migrationMapping && Object.keys(migrationMapping).length > 0) {
      const { data: allCurrentSchedules } = await supabase
        .from('project_schedule')
        .select('id, start_time, end_time')
        .eq('project_id', projectId);

      const scheduleByDateTime = new Map<string, string>();
      (allCurrentSchedules || []).forEach(s => {
        const date = extractDateFromTimestamp(s.start_time);
        const startTime = timestampTo12h(s.start_time);
        const key = `${date}|${startTime}`;
        scheduleByDateTime.set(key, s.id);
      });

      for (const [oldScheduleId, destination] of Object.entries(migrationMapping)) {
        if (!oldScheduleId || destination === '' || destination === 'none') {
          continue;
        }

        if (destination === 'delete') {
          await supabase
            .from('model_assignments')
            .delete()
            .eq('schedule_id', oldScheduleId);
          continue;
        }

        const targetScheduleId = scheduleByDateTime.get(destination);

        if (!targetScheduleId) {
          logError(`No schedule found for destination ${destination}`, { action: 'updateProject.migration', projectId });
          continue;
        }

        // Batch: fetch old assignments and existing target assignments in parallel
        const [{ data: oldAssignments }, { data: targetAssignments }] = await Promise.all([
          supabase.from('model_assignments').select('id, model_id').eq('schedule_id', oldScheduleId),
          supabase.from('model_assignments').select('model_id').eq('schedule_id', targetScheduleId),
        ]);

        const existingModelIds = new Set((targetAssignments || []).map(a => a.model_id));
        const toMigrate = (oldAssignments || []).filter(a => !existingModelIds.has(a.model_id));
        const toDeduplicate = (oldAssignments || []).filter(a => existingModelIds.has(a.model_id));

        // Batch update: migrate assignments that don't conflict
        if (toMigrate.length > 0) {
          const { error: migrateError } = await supabase
            .from('model_assignments')
            .update({ schedule_id: targetScheduleId })
            .in('id', toMigrate.map(a => a.id));

          if (migrateError) {
            logError(migrateError, { action: 'updateProject.migration.batch_update', projectId });
          }
        }

        // Batch delete: remove duplicates that already exist at target
        if (toDeduplicate.length > 0) {
          await supabase
            .from('model_assignments')
            .delete()
            .in('id', toDeduplicate.map(a => a.id));
        }
      }
    }

    // STEP 3: Delete old schedules after migration
    if (scheduleIdsToDelete.length > 0) {
      await supabase
        .from('project_schedule')
        .delete()
        .in('id', scheduleIdsToDelete);
    }

    // Propagate default fees only if they actually changed
    const newFee = parsed.data.default_model_fee;
    const newFeeType = parsed.data.default_fee_type;
    const newCurrency = parsed.data.currency;
    const newTradeFee = parsed.data.default_model_trade_fee;

    const feeChanged =
      currentProject.default_model_fee !== newFee ||
      currentProject.default_fee_type !== newFeeType ||
      currentProject.currency !== newCurrency ||
      currentProject.default_model_trade_fee !== newTradeFee;

    if (feeChanged) {
      const { error: updateModelsError } = await supabase
        .from('projects_models')
        .update({
          agreed_fee: newFee ?? 0,
          fee_type: newFeeType || 'per_day',
          currency: newCurrency || 'GTQ',
          trade_fee: newTradeFee ?? 0,
        })
        .eq('project_id', projectId);

      if (updateModelsError) {
        logError(updateModelsError, { action: 'updateProject.fee_propagation', projectId });
      }
    }

    revalidatePath('/dashboard/projects');
    revalidatePath(`/dashboard/projects/${projectId}`);

    await logActivity({
      category: 'project',
      title: ActivityTitles.projectUpdated(parsed.data.project_name || 'Proyecto'),
      metadata: { entity_id: projectId, entity_type: 'project', action: 'updated' },
    });

    return { success: true, projectId };

  } catch (err) {
    logError(err, { action: 'updateProject.catch_all' });
    return { success: false, error: 'Error inesperado al actualizar el proyecto.' };
  }
}

// ─────────────────────────────────────────────
// deleteProject
// ─────────────────────────────────────────────

export async function deleteProject(id: string): Promise<ActionState> {
  const uuidError = assertUUID(id, 'ID de proyecto');
  if (uuidError) return uuidError;

  const supabase = await createSupabaseServerActionClient()

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Usuario no autenticado.' }
    }

    // Fetch project name before deletion (for activity log)
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('user_id, project_name')
      .eq('id', id)
      .single();

    if (projectError || project?.user_id !== user.id) {
      return { success: false, error: 'No tienes permiso para eliminar este proyecto.' }
    }

    // Atomic cascade delete via DB function (single transaction)
    const { error: rpcError } = await supabase.rpc('delete_project_cascade', {
      p_project_id: id,
      p_user_id: user.id,
    });

    if (rpcError) {
      logError(rpcError, { action: 'deleteProject.rpc', projectId: id });
      return { success: false, error: 'Error al eliminar el proyecto de la base de datos.' };
    }

    revalidatePath('/dashboard/projects')

    await logActivity({
      category: 'project',
      title: ActivityTitles.projectDeleted(project.project_name || 'Proyecto'),
      metadata: { entity_id: id, entity_type: 'project', action: 'deleted' },
    });

    return { success: true }
  } catch (err: unknown) {
    logError(err, { action: 'deleteProject', projectId: id })

    const errorMessage = err instanceof Error
      ? err.message
      : 'Error desconocido';

    return { success: false, error: `No se pudo eliminar el proyecto: ${errorMessage}` }
  }
}
