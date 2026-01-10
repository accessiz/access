'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

import { logError } from '@/lib/utils/errors'
import type { ProjectStatus } from '@/lib/types'
import { projectFormSchema } from '@/lib/schemas/projects'
import { logActivity } from '@/lib/activity-logger'
import { ActivityTitles } from '@/lib/activity-titles'

type ActionState = { success: boolean; error?: string; errors?: Record<string, string>; projectId?: string; };

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
        set(name: string, value: string, options) {
          try { cookieStore.set({ name, value, ...options }) } catch { }
        },
        remove(name: string, options) {
          try { cookieStore.set({ name, value: '', ...options }) } catch { }
        },
      },
    }
  )
}

const convertToTimestamp = (date: string, time12h: string) => {
  const [time, period] = time12h.split(' ');
  const [hoursStr, minutesStr] = time.split(':');
  let hours = Number(hoursStr);
  const minutes = Number(minutesStr);

  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  // Usar la fecha tal cual y añadir la hora
  return `${date}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
};

// Interface para entradas de schedule del FormData
interface FormDataScheduleEntry {
  date?: FormDataEntryValue | null;
  startTime?: FormDataEntryValue | null;
  endTime?: FormDataEntryValue | null;
}

// Tipos para detección de cambios en schedule
export type ScheduleChangeType = 'added' | 'removed' | 'modified';

export interface ScheduleChange {
  type: ScheduleChangeType;
  oldScheduleId?: string;
  oldDate?: string;
  oldStartTime?: string;
  oldEndTime?: string;
  newDate?: string;
  newStartTime?: string;
  newEndTime?: string;
  assignmentCount?: number;
}

export interface ScheduleAnalysis {
  hasChanges: boolean;
  hasAffectedAssignments: boolean;
  changes: ScheduleChange[];
  totalAffectedAssignments: number;
  // Las nuevas fechas disponibles para migración
  newSchedules: { date: string; startTime: string; endTime: string }[];
}

// Tipo para el mapeo de migración manual
// Mapea oldScheduleId -> newScheduleDate | 'none' | 'delete'
export type MigrationMapping = Record<string, string | 'none' | 'delete'>;


// Helper para convertir timestamp a formato de hora 12h
// IMPORTANTE: Usamos UTC porque los timestamps se guardan en UTC y queremos mostrarlos tal cual
const timestampTo12h = (timestamp: string) => {
  const date = new Date(timestamp);
  let hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';

  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
};

// Helper para extraer la fecha del timestamp (en UTC)
const extractDateFromTimestamp = (timestamp: string) => {
  // Parsear la fecha en UTC para evitar problemas de zona horaria
  const date = new Date(timestamp);
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Función para analizar cambios entre schedule existente y nuevo
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
    // Obtener schedules existentes con sus asignaciones
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

    // Mapear schedules existentes por fecha+hora para comparación
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

    // Mapear nuevos schedules
    const newMap = new Map<string, {
      date: string;
      startTime: string;
      endTime: string;
    }>();

    newSchedule.forEach(s => {
      const key = `${s.date}-${s.startTime}-${s.endTime}`;
      newMap.set(key, s);
    });

    // Detectar schedules eliminados
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

    // Detectar schedules añadidos
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

    // Calcular estadísticas
    const totalAffectedAssignments = changes
      .filter(c => c.type === 'removed')
      .reduce((sum, c) => sum + (c.assignmentCount || 0), 0);

    // Preparar las nuevas fechas para el modal de mapeo
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

// Tipo para opciones de migración
export type MigrationOption = 'migrate' | 'keep' | 'delete';

export async function createProject(
  _prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createSupabaseServerActionClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Usuario no autenticado.' };
  }

  // Manually construct the data object for validation
  const scheduleEntries = Array.from(formData.keys())
    .filter(key => key.startsWith('schedule.'))
    .reduce((acc, key) => {
      const match = key.match(/schedule\.(\d+)\.(date|startTime|endTime)/);
      if (match) {
        const index = parseInt(match[1], 10);
        const field = match[2];
        if (!acc[index]) acc[index] = {} as FormDataScheduleEntry;
        (acc[index] as Record<string, FormDataEntryValue | null>)[field] = formData.get(key);
      }
      return acc;
    }, [] as FormDataScheduleEntry[]);


  // Extraer project_types del FormData
  const projectTypesEntries: string[] = [];
  Array.from(formData.keys())
    .filter(key => key.startsWith('project_types['))
    .forEach(key => {
      const value = formData.get(key);
      if (value && typeof value === 'string') {
        projectTypesEntries.push(value);
      }
    });

  const rawData = {
    project_name: formData.get('project_name'),
    client_name: formData.get('client_name'),
    // Nuevos campos
    client_id: formData.get('client_id') || null,
    brand_id: formData.get('brand_id') || null,
    project_types: projectTypesEntries.length > 0 ? projectTypesEntries : null,
    password: formData.get('password'),
    schedule: scheduleEntries.filter(entry => entry.date || entry.startTime || entry.endTime),
    // Campos de tarifa
    default_model_fee: formData.get('default_model_fee') || null,
    default_fee_type: formData.get('default_fee_type') || 'per_day',
    currency: formData.get('currency') || 'GTQ',
    // Campos de facturación al cliente
    revenue: formData.get('revenue') || null,
    tax_percentage: formData.get('tax_percentage') || 12,
    client_payment_status: formData.get('client_payment_status') || 'pending',
    invoice_number: formData.get('invoice_number') || null,
    invoice_date: formData.get('invoice_date') || null,
  };

  const parsed = projectFormSchema.safeParse(rawData);

  if (!parsed.success) {
    // Procesar errores para hacerlos más claros
    const zodErrors = parsed.error.issues;
    const errorMessages: Record<string, string> = {};

    for (const err of zodErrors) {
      const path = err.path.join('.');

      // Si el error es en un schedule específico, hacerlo más claro
      if (path.startsWith('schedule.') && rawData.schedule) {
        const match = path.match(/schedule\.(\d+)/);
        if (match) {
          const index = parseInt(match[1]);
          const scheduleItem = rawData.schedule[index];
          if (scheduleItem?.date) {
            const fecha = new Date(`${scheduleItem.date}T00:00:00`).toLocaleDateString('es-ES', {
              weekday: 'short',
              day: 'numeric',
              month: 'short'
            });
            errorMessages['schedule'] = `Error en la fecha ${fecha}: ${err.message}`;
            continue;
          }
        }
      }

      // Mensaje genérico
      if (!errorMessages[path]) {
        errorMessages[path] = err.message;
      }
    }

    return {
      success: false,
      error: Object.values(errorMessages)[0] || 'Campos inválidos.',
      errors: errorMessages,
    };
  }

  const { password, ...restOfData } = parsed.data;

  try {
    const normalizedPassword = password ? password : null;
    const schedule = (parsed.data.schedule && parsed.data.schedule.length > 0) ? parsed.data.schedule : null;

    const insertPayload = {
      ...restOfData,
      password: normalizedPassword,
      schedule, // Mantenemos el JSON por ahora como respaldo
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

    // Insertar en la nueva tabla project_schedule
    if (schedule && schedule.length > 0) {
      const schedulePayload = schedule.map(item => ({
        project_id: newProject.id,
        title: parsed.data.project_name, // O una descripción genérica
        start_time: convertToTimestamp(item.date, item.startTime),
        end_time: convertToTimestamp(item.date, item.endTime),
        is_call_time: false
      }));

      const { error: scheduleError } = await supabase
        .from('project_schedule')
        .insert(schedulePayload);

      if (scheduleError) {
        logError(scheduleError, { action: 'createProject.schedule_insert', projectId: newProject.id });
        // No fallamos toda la creación por esto, pero lo logueamos
      }
    }

    revalidatePath('/dashboard/projects');

    // Log activity
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

export async function updateProject(
  projectId: string,
  _prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createSupabaseServerActionClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Usuario no autenticado.' };
  }

  // Verify ownership and get current default_model_fee
  const { data: currentProject, error: ownerError } = await supabase
    .from('projects')
    .select('user_id, default_model_fee, default_fee_type, currency')
    .eq('id', projectId)
    .single();

  if (ownerError || currentProject?.user_id !== user.id) {
    return { success: false, error: 'No tienes permiso para editar este proyecto.' };
  }

  // Guardar la tarifa anterior para comparar después
  const previousFee = currentProject.default_model_fee;
  const previousFeeType = currentProject.default_fee_type;
  const previousCurrency = currentProject.currency;

  const scheduleEntries = Array.from(formData.keys())
    .filter(key => key.startsWith('schedule.'))
    .reduce((acc, key) => {
      const match = key.match(/schedule\.(\d+)\.(date|startTime|endTime)/);
      if (match) {
        const index = parseInt(match[1], 10);
        const field = match[2];
        if (!acc[index]) acc[index] = {} as FormDataScheduleEntry;
        (acc[index] as Record<string, FormDataEntryValue | null>)[field] = formData.get(key);
      }
      return acc;
    }, [] as FormDataScheduleEntry[]);


  // Extraer project_types del FormData
  const projectTypesEntries: string[] = [];
  Array.from(formData.keys())
    .filter(key => key.startsWith('project_types['))
    .forEach(key => {
      const value = formData.get(key);
      if (value && typeof value === 'string') {
        projectTypesEntries.push(value);
      }
    });

  // Extraer migrationMapping del FormData (si existe)
  const migrationMappingStr = formData.get('migrationMapping') as string | null;
  let migrationMapping: MigrationMapping | null = null;
  if (migrationMappingStr) {
    try {
      migrationMapping = JSON.parse(migrationMappingStr);
    } catch (e) {
      console.error('[updateProject] Error parsing migrationMapping:', e);
    }
  }

  const rawData = {
    project_name: formData.get('project_name'),
    client_name: formData.get('client_name'),
    // Nuevos campos
    client_id: formData.get('client_id') || null,
    brand_id: formData.get('brand_id') || null,
    project_types: projectTypesEntries.length > 0 ? projectTypesEntries : null,
    password: formData.get('password'),
    schedule: scheduleEntries.filter(entry => entry.date || entry.startTime || entry.endTime),
    // Campos de tarifa
    default_model_fee: formData.get('default_model_fee') || null,
    default_fee_type: formData.get('default_fee_type') || 'per_day',
    currency: formData.get('currency') || 'GTQ',
    // Campos de facturación al cliente
    revenue: formData.get('revenue') || null,
    tax_percentage: formData.get('tax_percentage') || 12,
    client_payment_status: formData.get('client_payment_status') || 'pending',
    invoice_number: formData.get('invoice_number') || null,
    invoice_date: formData.get('invoice_date') || null,
  };

  const parsed = projectFormSchema.safeParse(rawData);

  if (!parsed.success) {
    // Procesar errores para hacerlos más claros
    const zodErrors = parsed.error.issues;
    const errorMessages: Record<string, string> = {};

    for (const err of zodErrors) {
      const path = err.path.join('.');

      // Si el error es en un schedule específico, hacerlo más claro
      if (path.startsWith('schedule.') && rawData.schedule) {
        const match = path.match(/schedule\.(\d+)/);
        if (match) {
          const index = parseInt(match[1]);
          const scheduleItem = rawData.schedule[index];
          if (scheduleItem?.date) {
            const fecha = new Date(`${scheduleItem.date}T00:00:00`).toLocaleDateString('es-ES', {
              weekday: 'short',
              day: 'numeric',
              month: 'short'
            });
            errorMessages['schedule'] = `Error en la fecha ${fecha}: ${err.message}`;
            continue;
          }
        }
      }

      // Mensaje genérico
      if (!errorMessages[path]) {
        errorMessages[path] = err.message;
      }
    }

    return {
      success: false,
      error: Object.values(errorMessages)[0] || 'Campos inválidos.',
      errors: errorMessages,
    };
  }

  const { password, ...restOfData } = parsed.data;

  try {
    const normalizedPassword = password ? password : null;
    const schedule = (parsed.data.schedule && parsed.data.schedule.length > 0) ? parsed.data.schedule : null;

    const updatePayload = {
      ...restOfData,
      password: normalizedPassword,
      schedule,
    };

    const { error } = await supabase
      .from('projects')
      .update(updatePayload)
      .eq('id', projectId);

    if (error) {
      logError(error, { action: 'updateProject' });
      return { success: false, error: 'Error al actualizar en la base de datos.' };
    }

    // ACTUALIZACIÓN INTELIGENTE DE SCHEDULES
    // En lugar de eliminar todo, comparamos y solo modificamos lo necesario

    // Obtener schedules existentes
    const { data: existingSchedules } = await supabase
      .from('project_schedule')
      .select('id, start_time, end_time')
      .eq('project_id', projectId);

    // Crear mapas para comparación eficiente
    const existingMap = new Map<string, string>(); // key -> id
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

    // Procesar los nuevos schedules
    if (schedule && schedule.length > 0) {
      schedule.forEach(item => {
        const key = `${item.date}-${item.startTime}-${item.endTime}`;
        newScheduleKeys.add(key);

        // Si no existe, marcarlo para insertar
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

    // Encontrar schedules a eliminar (los que ya no están en la nueva lista)
    const scheduleIdsToDelete: string[] = [];
    existingMap.forEach((id, key) => {
      if (!newScheduleKeys.has(key)) {
        scheduleIdsToDelete.push(id);
      }
    });

    // PASO 1: Insertar los nuevos schedules PRIMERO
    if (schedulesToInsert.length > 0) {
      await supabase
        .from('project_schedule')
        .insert(schedulesToInsert);
    }

    // PASO 2: Si hay migrationMapping, aplicar la migración ANTES de eliminar los schedules viejos
    if (migrationMapping && Object.keys(migrationMapping).length > 0) {
      // Obtener todos los schedules actuales (incluyendo los recién insertados)
      const { data: allCurrentSchedules } = await supabase
        .from('project_schedule')
        .select('id, start_time, end_time')
        .eq('project_id', projectId);

      // Crear un mapa de fecha+hora -> schedule_id
      const scheduleByDateTime = new Map<string, string>();
      (allCurrentSchedules || []).forEach(s => {
        const date = extractDateFromTimestamp(s.start_time);
        const startTime = timestampTo12h(s.start_time);
        const key = `${date}|${startTime}`;
        scheduleByDateTime.set(key, s.id);
      });

      for (const [oldScheduleId, destination] of Object.entries(migrationMapping)) {
        if (!oldScheduleId || destination === '' || destination === 'none') {
          // 'none' = mantener sin schedule (el DELETE con ON DELETE SET NULL lo manejará)
          continue;
        }

        if (destination === 'delete') {
          // Eliminar las asignaciones de este schedule
          await supabase
            .from('model_assignments')
            .delete()
            .eq('schedule_id', oldScheduleId);
          continue;
        }

        // Migrar a nuevo schedule
        // El destination está en formato "date|startTime"
        const targetScheduleId = scheduleByDateTime.get(destination);

        if (!targetScheduleId) {
          console.error(`[updateProject] No se encontró schedule para destino ${destination}`);
          continue;
        }

        // Obtener asignaciones del schedule viejo
        const { data: oldAssignments } = await supabase
          .from('model_assignments')
          .select('id, model_id')
          .eq('schedule_id', oldScheduleId);

        // Migrar cada asignación
        for (const assignment of oldAssignments || []) {
          // Verificar si ya existe en el destino
          const { data: existing } = await supabase
            .from('model_assignments')
            .select('id')
            .eq('model_id', assignment.model_id)
            .eq('schedule_id', targetScheduleId)
            .maybeSingle();

          if (!existing) {
            // Actualizar para apuntar al nuevo schedule
            const { error: updateError } = await supabase
              .from('model_assignments')
              .update({ schedule_id: targetScheduleId })
              .eq('id', assignment.id);

            if (updateError) {
              console.error('[updateProject] Error al migrar asignación:', updateError);
            }
          } else {
            // Ya existe, eliminar la duplicada
            await supabase
              .from('model_assignments')
              .delete()
              .eq('id', assignment.id);
          }
        }
      }
    }

    // PASO 3: Eliminar los schedules que ya no existen (DESPUÉS de migrar)
    // NOTA: Con ON DELETE SET NULL, las asignaciones que no se migraron quedarán con schedule_id = NULL
    if (scheduleIdsToDelete.length > 0) {
      await supabase
        .from('project_schedule')
        .delete()
        .in('id', scheduleIdsToDelete);
    }

    // Si cambió la tarifa por defecto, actualizar modelos que tenían la tarifa anterior
    const newFee = parsed.data.default_model_fee;
    const newFeeType = parsed.data.default_fee_type;
    const newCurrency = parsed.data.currency;

    if (previousFee !== null && newFee !== null && previousFee !== newFee) {
      // Actualizar solo los modelos que tenían la tarifa anterior (no personalizados)
      await supabase
        .from('projects_models')
        .update({
          agreed_fee: newFee,
          fee_type: newFeeType || previousFeeType,
          currency: newCurrency || previousCurrency
        })
        .eq('project_id', projectId)
        .eq('agreed_fee', previousFee); // Solo los que tenían la tarifa anterior
    }

    // Si cambió solo el tipo de tarifa o moneda (pero no el monto), también actualizar
    if (newFee === previousFee && (newFeeType !== previousFeeType || newCurrency !== previousCurrency)) {
      await supabase
        .from('projects_models')
        .update({
          fee_type: newFeeType || previousFeeType,
          currency: newCurrency || previousCurrency
        })
        .eq('project_id', projectId)
        .eq('agreed_fee', previousFee);
    }

    revalidatePath('/dashboard/projects');
    revalidatePath(`/dashboard/projects/${projectId}`);

    // Log activity
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



export async function deleteProject(id: string) {
  const supabase = await createSupabaseServerActionClient()

  try {
    // Primero verificar que el usuario tenga permiso
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Usuario no autenticado.' }
    }

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('user_id, project_name')
      .eq('id', id)
      .single();

    if (projectError || project?.user_id !== user.id) {
      return { success: false, error: 'No tienes permiso para eliminar este proyecto.' }
    }

    // Primero obtener los IDs de los schedules de este proyecto
    const { data: schedules } = await supabase
      .from('project_schedule')
      .select('id')
      .eq('project_id', id);

    const scheduleIds = schedules?.map(s => s.id) || [];

    // Eliminar dependencias en orden correcto:
    // 1. Eliminar model_assignments por project_id
    const { error: assignmentsError } = await supabase
      .from('model_assignments')
      .delete()
      .eq('project_id', id);

    if (assignmentsError) {
      console.error('[deleteProject] Error al eliminar assignments por project_id:', assignmentsError);
    }

    // 1b. También eliminar model_assignments por schedule_id (para casos legacy)
    if (scheduleIds.length > 0) {
      const { error: assignmentsByScheduleError } = await supabase
        .from('model_assignments')
        .delete()
        .in('schedule_id', scheduleIds);

      if (assignmentsByScheduleError) {
        console.error('[deleteProject] Error al eliminar assignments por schedule_id:', assignmentsByScheduleError);
      }
    }

    // 2. Eliminar project_schedule
    const { error: scheduleError } = await supabase
      .from('project_schedule')
      .delete()
      .eq('project_id', id);

    if (scheduleError) {
      console.error('[deleteProject] Error al eliminar schedules:', scheduleError);
    }

    // 3. Eliminar projects_models
    const { error: modelsError } = await supabase
      .from('projects_models')
      .delete()
      .eq('project_id', id);

    if (modelsError) {
      console.error('[deleteProject] Error al eliminar projects_models:', modelsError);
    }

    // 4. Finalmente eliminar el proyecto
    const { error } = await supabase.from('projects').delete().eq('id', id)

    if (error) {
      console.error('[deleteProject] Error al eliminar proyecto:', error);
      throw error;
    }

    revalidatePath('/dashboard/projects')

    // Log activity
    await logActivity({
      category: 'project',
      title: ActivityTitles.projectDeleted(project.project_name || 'Proyecto'),
      metadata: { entity_id: id, entity_type: 'project', action: 'deleted' },
    });

    return { success: true }
  } catch (err: unknown) {
    console.error('[deleteProject] Error completo:', JSON.stringify(err, null, 2));
    logError(err, { action: 'deleteProject', projectId: id })

    // Manejar diferentes tipos de errores
    let errorMessage = 'Error desconocido';
    if (err instanceof Error) {
      errorMessage = err.message;
    } else if (typeof err === 'object' && err !== null) {
      const errObj = err as { message?: string; details?: string; hint?: string };
      errorMessage = errObj.message || errObj.details || errObj.hint || JSON.stringify(err);
    }

    return { success: false, error: `No se pudo eliminar el proyecto: ${errorMessage}` }
  }
}

export async function completeProjectReview(projectId: string) {
  const supabase = await createSupabaseServerActionClient()

  const statusToSet: ProjectStatus = 'completed'

  try {
    const { error } = await supabase
      .from('projects')
      .update({
        status: statusToSet,
        end_date: new Date().toISOString(), // Registrar end_date
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

export async function updateProjectStatus(
  projectId: string,
  status: ProjectStatus,
  setStartDate: boolean = false
) {
  const supabase = await createSupabaseServerActionClient()

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

    // Si se indica y no hay fecha de inicio previa, la establecemos
    if (setStartDate && !projRow?.start_date) {
      updatePayload.start_date = new Date().toISOString();
    }

    // Si el estado es "completed", también establecemos end_date
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

export async function verifyProjectPassword(projectId: string, password: string) {
  const supabase = await createSupabaseServerActionClient()

  try {
    const { data: project, error } = await supabase
      .from('projects')
      .select('id, password')
      .eq('id', projectId)
      .single()

    if (error || !project) {
      if (error) logError(error, { action: 'verifyProjectPassword.fetch', projectId })
      return { success: false, error: 'Proyecto no encontrado.' }
    }

    if (!project.password) {
      const cookieStore = await cookies()
      cookieStore.set({
        name: `project_access_${projectId}`,
        value: 'true',
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      })
      return { success: true }
    }

    const isValid = project.password === password
    if (!isValid) {
      return { success: false, error: 'Contraseña incorrecta.' }
    }

    const cookieStore = await cookies()
    cookieStore.set({
      name: `project_access_${projectId}`,
      value: 'true',
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    })

    return { success: true }
  } catch (err) {
    logError(err, { action: 'verifyProjectPassword.catch_all', projectId })
    return { success: false, error: 'No se pudo verificar la contraseña.' }
  }
}

export async function syncProjectSchedule(projectId: string) {
  const supabase = await createSupabaseServerActionClient();

  try {
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('project_name, schedule')
      .eq('id', projectId)
      .single();

    if (fetchError || !project) return { success: false, error: 'Proyecto no encontrado.' };

    // Type for legacy schedule JSON stored in project
    interface LegacyScheduleItem {
      date: string;
      startTime: string;
      endTime: string;
    }

    const schedule = project.schedule as LegacyScheduleItem[] | null;
    if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
      return { success: true, message: 'No hay horarios que sincronizar.' };
    }

    // Verificar si ya tiene horarios en la tabla
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

/**
 * Auto-cierra un proyecto si ya pasó su fecha final.
 * - Los modelos con client_selection = 'pending' → 'rejected'
 * - El proyecto cambia a status = 'completed'
 * Retorna si el proyecto fue cerrado o no.
 */
export async function autoCloseExpiredProject(projectId: string): Promise<{ closed: boolean; error?: string }> {
  const supabase = await createSupabaseServerActionClient();

  try {
    // 1. Obtener el proyecto y su schedule
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, status, schedule')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return { closed: false, error: 'Proyecto no encontrado.' };
    }

    // Si ya está completed o archived, no hacer nada
    if (project.status === 'completed' || project.status === 'archived') {
      return { closed: false };
    }

    // 2. Determinar la fecha final del proyecto
    const schedule = project.schedule as { date: string }[] | null;
    if (!schedule || schedule.length === 0) {
      return { closed: false }; // Sin fechas, no auto-cerrar
    }

    // Encontrar la fecha más tardía
    const dates = schedule.map(s => new Date(s.date + 'T23:59:59'));
    const lastDate = new Date(Math.max(...dates.map(d => d.getTime())));

    // 3. Verificar si ya pasó la fecha
    const now = new Date();
    if (now <= lastDate) {
      return { closed: false }; // Aún no ha pasado
    }

    // 4. Auto-cerrar: cambiar pendientes a rechazados
    const { error: updateModelsError } = await supabase
      .from('projects_models')
      .update({ client_selection: 'rejected' })
      .eq('project_id', projectId)
      .eq('client_selection', 'pending');

    if (updateModelsError) {
      logError(updateModelsError, { action: 'autoCloseExpiredProject.updateModels', projectId });
    }

    // 5. Cambiar estado del proyecto a completed
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

/**
 * Maneja las asignaciones huérfanas después de cambios en schedules
 * Opciones:
 * - 'delete': Eliminar todas las asignaciones huérfanas
 * - 'keep': No hacer nada (las asignaciones quedan con schedule_id = NULL pero project_id intacto)
 * - 'migrate': Intentar migrar a nuevos schedules basándose en la fecha más cercana
 */
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
      // No hacer nada, las asignaciones permanecen con schedule_id = NULL
      return { success: true, migratedCount: 0, deletedCount: 0 };
    }

    if (action === 'delete') {
      // Eliminar todas las asignaciones huérfanas
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
      // Obtener asignaciones huérfanas
      const { data: orphanedAssignments, error: fetchError } = await supabase
        .from('model_assignments')
        .select('id, model_id, created_at')
        .eq('project_id', projectId)
        .is('schedule_id', null);

      console.log('[handleOrphanedAssignments] Buscando asignaciones huérfanas para proyecto:', projectId);
      console.log('[handleOrphanedAssignments] Asignaciones encontradas:', orphanedAssignments?.length || 0);

      if (fetchError) {
        console.error('[handleOrphanedAssignments] Error al buscar:', fetchError);
        logError(fetchError, { action: 'handleOrphanedAssignments.fetch', projectId });
        return { success: false, error: 'Error al obtener asignaciones huérfanas.' };
      }

      if (!orphanedAssignments || orphanedAssignments.length === 0) {
        return { success: true, migratedCount: 0 };
      }

      // Obtener schedules disponibles para el proyecto
      const { data: availableSchedules, error: schedulesError } = await supabase
        .from('project_schedule')
        .select('id, start_time')
        .eq('project_id', projectId)
        .order('start_time', { ascending: true });

      if (schedulesError || !availableSchedules || availableSchedules.length === 0) {
        // No hay schedules a los que migrar, mantener como huérfanas
        return { success: true, migratedCount: 0 };
      }

      // Migrar cada asignación al primer schedule disponible
      // (Estrategia simple: asignar al primer horario del proyecto)
      const firstScheduleId = availableSchedules[0].id;
      let migratedCount = 0;

      for (const assignment of orphanedAssignments) {
        // Verificar que no exista ya una asignación para este modelo en este schedule
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

/**
 * Obtiene las asignaciones huérfanas (sin schedule_id) para un proyecto
 */
export async function getOrphanedAssignments(
  projectId: string
): Promise<{ success: boolean; count?: number; assignments?: { id: string; modelId: string; modelAlias: string }[]; error?: string }> {
  const supabase = await createSupabaseServerActionClient();

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

    // Type for orphaned assignment query result
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

/**
 * Aplica el mapeo de migración de asignaciones
 * Mueve los modelos de schedules antiguos a nuevos según el mapeo proporcionado
 * @param projectId - ID del proyecto
 * @param mapping - Objeto con oldScheduleId como key y newDate | 'none' | 'delete' como value
 * @param newSchedule - Las nuevas fechas del proyecto (para obtener los nuevos schedule_ids)
 */
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

    // Procesar cada schedule antiguo en el mapeo
    for (const [oldScheduleId, destination] of Object.entries(mapping)) {
      if (!oldScheduleId) continue;

      // Obtener las asignaciones del schedule antiguo
      const { data: assignments, error: fetchError } = await supabase
        .from('model_assignments')
        .select('id, model_id')
        .eq('schedule_id', oldScheduleId);

      if (fetchError) {
        console.error(`[applyMigrationMapping] Error al obtener asignaciones para schedule ${oldScheduleId}:`, fetchError);
        continue;
      }

      if (!assignments || assignments.length === 0) {
        continue;
      }

      if (destination === 'delete') {
        // Eliminar las asignaciones
        const { error: deleteError } = await supabase
          .from('model_assignments')
          .delete()
          .eq('schedule_id', oldScheduleId);

        if (deleteError) {
          console.error(`[applyMigrationMapping] Error al eliminar asignaciones:`, deleteError);
        } else {
          deletedCount += assignments.length;
        }
      } else if (destination === 'none') {
        // Mantener sin fecha (set schedule_id = null)
        const { error: updateError } = await supabase
          .from('model_assignments')
          .update({ schedule_id: null })
          .eq('schedule_id', oldScheduleId);

        if (updateError) {
          console.error(`[applyMigrationMapping] Error al desasignar:`, updateError);
        } else {
          keptCount += assignments.length;
        }
      } else {
        // Migrar a una nueva fecha - necesitamos encontrar el schedule_id de la fecha nueva
        // El destination puede ser en formato "date|startTime" (nuevo) o solo "date" (legacy)
        let targetDate: string;
        let targetStartTime: string | undefined;

        if (destination.includes('|')) {
          // Nuevo formato: date|startTime
          const [date, startTime] = destination.split('|');
          targetDate = date;
          targetStartTime = startTime;
        } else {
          // Formato legacy: solo date
          targetDate = destination;
        }

        // Buscar el schedule que coincida con la fecha (y opcionalmente hora)
        const targetScheduleData = newSchedule.find(s =>
          s.date === targetDate && (targetStartTime ? s.startTime === targetStartTime : true)
        );

        if (!targetScheduleData) {
          console.error(`[applyMigrationMapping] No se encontró schedule para fecha ${targetDate}`);
          continue;
        }

        // Buscar si ya existe un schedule con esta fecha en project_schedule
        const startTimestamp = convertToTimestamp(targetScheduleData.date, targetScheduleData.startTime);
        const endTimestamp = convertToTimestamp(targetScheduleData.date, targetScheduleData.endTime);

        const { data: existingSchedule } = await supabase
          .from('project_schedule')
          .select('id')
          .eq('project_id', projectId)
          .eq('start_time', startTimestamp)
          .maybeSingle();

        let targetScheduleId = existingSchedule?.id;

        // Si no existe, crear el schedule primero
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
            console.error(`[applyMigrationMapping] Error al crear schedule:`, createError);
            continue;
          }
          targetScheduleId = newScheduleRecord.id;
        }

        // Migrar cada asignación (evitando duplicados)
        for (const assignment of assignments) {
          // Verificar si ya existe asignación para este modelo en el nuevo schedule
          const { data: existing } = await supabase
            .from('model_assignments')
            .select('id')
            .eq('model_id', assignment.model_id)
            .eq('schedule_id', targetScheduleId)
            .maybeSingle();

          if (!existing) {
            // Actualizar la asignación existente para apuntar al nuevo schedule
            const { error: updateError } = await supabase
              .from('model_assignments')
              .update({ schedule_id: targetScheduleId })
              .eq('id', assignment.id);

            if (!updateError) {
              migratedCount++;
            }
          } else {
            // Ya existe, eliminar la duplicada
            await supabase
              .from('model_assignments')
              .delete()
              .eq('id', assignment.id);
          }
        }
      }
    }

    console.log(`[applyMigrationMapping] Completado: migrados=${migratedCount}, eliminados=${deletedCount}, sin fecha=${keptCount}`);

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, migratedCount, deletedCount, keptCount };

  } catch (err) {
    logError(err, { action: 'applyMigrationMapping.catch_all', projectId });
    return { success: false, error: 'Error inesperado al migrar asignaciones.' };
  }
}
