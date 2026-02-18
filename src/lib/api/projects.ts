'use server';

import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from 'next/cache';
import { Model, Project } from "@/lib/types"; // Asegúrate que Model incluye client_selection?
import { logError } from '@/lib/utils/errors';

// --- INICIO DE LA CORRECCIÓN ---
// Se elimina BUCKET_NAME y se añade el helper para construir la URL de R2
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL?.replace(/\/$/, '') || '';

const toPublicUrl = (path: string | null | undefined): string | null => {
  if (!path || !R2_PUBLIC_URL) return null;
  return `${R2_PUBLIC_URL}/${path}`;
};
// --- FIN DE LA CORRECCIÓN ---
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1s

async function withRetry<T>(fn: () => T | PromiseLike<T>, retries = MAX_RETRIES): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      const isNetworkError = error instanceof Error &&
        (error.message.includes('fetch failed') || error.message.includes('timeout'));

      if (isNetworkError) {
        console.warn(`[Retry] Fetch failed, retrying in ${RETRY_DELAY}ms... (${retries} left)`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return withRetry(fn, retries - 1);
      }
    }
    throw error;
  }
}

const ITEMS_PER_PAGE = 25;

type SearchParams = {
  query?: string;
  year?: string;
  month?: string;
  status?: string;
  sortKey?: keyof Project;
  sortDir?: 'asc' | 'desc';
  currentPage?: number;
  limit?: number;
};

export async function getProjectYearsForUser(): Promise<number[]> {
  noStore();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    logError(new Error('No user logged in'), { action: 'getProjectYearsForUser', projectId: null });
    return [];
  }

  const years = new Set<number>();
  const pageSize = 1000;

  // 1. Obtener años de las fechas de schedule (fecha del evento)
  let from = 0;
  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from('project_schedule')
      .select('start_time, projects!inner(user_id)')
      .eq('projects.user_id', user.id)
      .order('start_time', { ascending: false })
      .range(from, to);

    if (error) {
      logError(error, { action: 'getProjectYearsForUser.schedules', params: { from, to } });
      break;
    }

    if (!data || data.length === 0) break;

    for (const row of data as Array<{ start_time: string | null }>) {
      if (!row.start_time) continue;
      const date = new Date(row.start_time);
      const year = date.getUTCFullYear();
      if (Number.isFinite(year)) years.add(year);
    }

    if (data.length < pageSize) break;
    from += pageSize;
  }

  // 2. También obtener años de created_at para proyectos antiguos sin schedule
  from = 0;
  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from('projects')
      .select('created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      logError(error, { action: 'getProjectYearsForUser.created', params: { from, to } });
      break;
    }

    if (!data || data.length === 0) break;

    for (const row of data as Array<{ created_at: string | null }>) {
      if (!row.created_at) continue;
      const date = new Date(row.created_at);
      const year = date.getUTCFullYear();
      if (Number.isFinite(year)) years.add(year);
    }

    if (data.length < pageSize) break;
    from += pageSize;
  }

  return Array.from(years).sort((a, b) => b - a);
}

// Función para obtener la lista de proyectos (con conteo de modelos asignados)
export async function getProjectsForUser(searchParams: SearchParams = {}) {
  noStore();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    logError(new Error('No user logged in'), { action: 'getProjectsForUser', projectId: null });
    return { data: [], count: 0 };
  }

  const currentPage = searchParams.currentPage || 1;
  const limit = searchParams.limit || ITEMS_PER_PAGE;

  // Incluir modelos aprobados con sus detalles (solo campos necesarios para evitar conflictos)
  let queryBuilder = supabase
    .from('projects')
    .select(`
      *,
      projects_models!fk_projects_models_project(
        client_selection,
        model_id,
        models!fk_projects_models_model(id, alias, cover_path)
      )
    `, { count: 'exact' })
    .eq('user_id', user.id);

  if (searchParams.query) {
    const searchQuery = `%${searchParams.query}%`;
    queryBuilder = queryBuilder.or(
      `project_name.ilike.${searchQuery},client_name.ilike.${searchQuery}`
    );
  }

  // Filtrar por estado (status)
  if (searchParams.status && searchParams.status !== 'all') {
    queryBuilder = queryBuilder.eq('status', searchParams.status);
  }

  // Filtrar por fecha: combina proyectos con schedule en el período + proyectos creados en el período (fallback para antiguos)
  const hasValidMonth = searchParams.month && searchParams.month !== 'all' && /^\d+$/.test(searchParams.month);
  const hasValidYear = searchParams.year && searchParams.year !== 'all' && /^\d{4}$/.test(searchParams.year);

  if (hasValidYear && hasValidMonth) {
    const year = parseInt(searchParams.year!);
    const month = parseInt(searchParams.month!);
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

    // Obtener IDs de proyectos con schedules en el rango de fechas
    const { data: scheduleData } = await supabase
      .from('project_schedule')
      .select('project_id')
      .gte('start_time', startDate)
      .lte('start_time', endDate);

    // También obtener proyectos creados en ese rango (fallback para proyectos antiguos sin schedule)
    const { data: createdData } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const scheduleIds = scheduleData?.map(s => s.project_id) || [];
    const createdIds = createdData?.map(p => p.id) || [];
    const projectIds = [...new Set([...scheduleIds, ...createdIds])];

    if (projectIds.length > 0) {
      queryBuilder = queryBuilder.in('id', projectIds);
    } else {
      return { data: [], count: 0 };
    }
  } else if (hasValidYear) {
    const year = parseInt(searchParams.year!);
    const startDate = new Date(year, 0, 1).toISOString();
    const endDate = new Date(year, 11, 31, 23, 59, 59).toISOString();

    // Obtener IDs de proyectos con schedules en el año
    const { data: scheduleData } = await supabase
      .from('project_schedule')
      .select('project_id')
      .gte('start_time', startDate)
      .lte('start_time', endDate);

    // También obtener proyectos creados en ese año (fallback para proyectos antiguos sin schedule)
    const { data: createdData } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const scheduleIds = scheduleData?.map(s => s.project_id) || [];
    const createdIds = createdData?.map(p => p.id) || [];
    const projectIds = [...new Set([...scheduleIds, ...createdIds])];

    if (projectIds.length > 0) {
      queryBuilder = queryBuilder.in('id', projectIds);
    } else {
      return { data: [], count: 0 };
    }
  }

  const sortKey = searchParams.sortKey || 'created_at';
  const sortDir = searchParams.sortDir || 'desc';
  queryBuilder = queryBuilder.order(sortKey, { ascending: sortDir === 'asc' });

  const from = (currentPage - 1) * limit;
  const to = from + limit - 1;
  queryBuilder = queryBuilder.range(from, to);

  const { data, error, count } = await queryBuilder;

  if (error) {
    logError(error, { action: 'fetch projects list', params: searchParams });
    return { data: [], count: 0 };
  }

  // Tipo para los datos de la relación
  type ProjectModelRelation = {
    client_selection: string | null;
    model_id: string;
    models: {
      id: string;
      alias: string | null;
      cover_path: string | null;
    } | null;
  };

  // Enriquecer con modelos aprobados
  const enrichedData = (data || []).map((project: Record<string, unknown>) => {
    const projectModels = project.projects_models as ProjectModelRelation[] | null;

    // Filtrar solo los aprobados y mapear a formato simplificado
    const approvedModels = (projectModels || [])
      .filter(pm => pm.client_selection === 'approved' && pm.models)
      .map(pm => ({
        id: pm.models!.id,
        alias: pm.models!.alias || 'Sin nombre',
        coverUrl: toPublicUrl(pm.models!.cover_path),
      }));

    return {
      ...project,
      assigned_models_count: projectModels?.length ?? 0,
      approved_models: approvedModels,
    };
  });

  return { data: enrichedData, count: count || 0 };
}

// Helper para formatear hora de DB (UTC) a 12h AM/PM
// IMPORTANTE: Usamos UTC porque los timestamps se guardan en UTC y queremos mostrarlos tal cual
const formatTimeTo12h = (isoString: string) => {
  const date = new Date(isoString);
  let hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  hours = hours ? hours : 12; // la hora '0' deberia ser '12'

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
};

// Helper para extraer la fecha del timestamp (en UTC)
const extractDateFromTimestampUTC = (isoString: string) => {
  const date = new Date(isoString);
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Función para obtener un proyecto por ID (MODIFICADA para usar project_schedule)
export async function getProjectById(idOrPublicId: string): Promise<Project | null> {
  noStore();
  const supabase = await createClient();

  // Determinar si parece un UUID (36 caracteres con guiones) o un public_id corto
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrPublicId);

  let query = supabase
    .from('projects')
    .select('*, project_schedule(*)');

  if (isUUID) {
    // Si es UUID, buscar en ambos campos
    query = query.or(`id.eq.${idOrPublicId},public_id.eq.${idOrPublicId}`);
  } else {
    // Si no es UUID, solo buscar en public_id para evitar errores de formato
    query = query.eq('public_id', idOrPublicId);
  }

  const { data, error } = await withRetry(async () => await query.maybeSingle());

  if (error) {
    if (error.code !== 'PGRST116') {
      logError(error, { action: 'getProjectById', idOrPublicId });
    }
    return null;
  }

  if (!data) return null;

  // Define proper type for project_schedule row
  interface ProjectScheduleRow {
    id: string;
    start_time: string;
    end_time: string;
    project_id: string;
  }

  const project = data as typeof data & {
    schedule?: { id: string; date: string; startTime: string; endTime: string }[];
    project_schedule?: ProjectScheduleRow[];
  };

  // Si tenemos datos en la tabla project_schedule, los usamos para poblar el campo schedule
  if (project.project_schedule && project.project_schedule.length > 0) {
    project.schedule = project.project_schedule.map((ps: ProjectScheduleRow) => ({
      id: ps.id,
      date: extractDateFromTimestampUTC(ps.start_time),
      startTime: formatTimeTo12h(ps.start_time),
      endTime: formatTimeTo12h(ps.end_time)
    }));
  }

  return project as Project;
}


// Función para obtener modelos de un proyecto (OPTIMIZADA)
export async function getModelsForProject(projectId: string): Promise<Model[]> {
  noStore();
  const supabase = await createClient();

  const { data: projectModelsData, error } = await supabase
    .from('projects_models')
    .select(`
      *,
      models (
        *,
        cover_path,
        portfolio_path
      )
    `)
    .eq('project_id', projectId);

  if (error || !projectModelsData) {
    logError(error || new Error('No data returned'), { action: 'getModelsForProject', projectId });
    return [];
  }

  const VALID_CLIENT_SELECTIONS_INNER = ['pending', 'approved', 'rejected'] as const;
  type ClientSelectionInner = typeof VALID_CLIENT_SELECTIONS_INNER[number];
  function isValidClientSelectionInner(selection: unknown): selection is ClientSelectionInner {
    if (typeof selection !== 'string') return false;
    return VALID_CLIENT_SELECTIONS_INNER.includes(selection as ClientSelectionInner);
  }

  const modelsWithPaths = projectModelsData.flatMap(item => {
    const modelData = item.models;
    if (!modelData || Array.isArray(modelData) || typeof modelData !== 'object') {
      console.warn(`Invalid model data found for project ${projectId}:`, item);
      return [];
    }
    const model = modelData as unknown as (Model & { cover_path?: string; portfolio_path?: string });
    const validatedSelection = isValidClientSelectionInner(item.client_selection)
      ? item.client_selection
      : null;

    return [{
      ...model,
      client_selection: validatedSelection,
      internal_status: item.internal_status,
      agreed_fee: item.agreed_fee,
      trade_fee: item.trade_fee, // Mapear trade_fee
      fee_type: item.fee_type,
      currency: item.currency,
      notes: item.notes,
    }];
  });

  // Fetch model assignments for this project's schedules
  const { data: projectSchedules } = await supabase
    .from('project_schedule')
    .select('id')
    .eq('project_id', projectId);

  const scheduleIds = projectSchedules?.map(ps => ps.id) || [];

  if (scheduleIds.length > 0) {
    const { data: assignments } = await supabase
      .from('model_assignments')
      .select('*')
      .in('schedule_id', scheduleIds);

    if (assignments) {
      modelsWithPaths.forEach(m => {
        m.assignments = assignments.filter(a => a.model_id === m.id);
      });
    }
  }

  // --- INICIO DE LA CORRECCIÓN ---
  // Se elimina toda la lógica de `createSignedUrls`.
  // Se mapean los resultados para construir la `coverUrl` y `portfolioUrl` públicas de R2.
  const enriched = modelsWithPaths.map(model => ({
    ...model,
    coverUrl: toPublicUrl(model.cover_path),
    portfolioUrl: toPublicUrl(model.portfolio_path),
  }));
  // --- FIN DE LA CORRECCIÓN ---

  return enriched;
}


// --- INICIO: Type Guard para client_selection ---
const VALID_CLIENT_SELECTIONS = ['pending', 'approved', 'rejected'] as const;
type ClientSelection = typeof VALID_CLIENT_SELECTIONS[number];

/**
 * Type Guard para validar el valor de client_selection de la DB.
 */
function isValidClientSelection(selection: unknown): selection is ClientSelection {
  if (typeof selection !== 'string') {
    return false; // No es válido si no es string
  }
  return VALID_CLIENT_SELECTIONS.includes(selection as ClientSelection);
}
// --- FIN: Type Guard para client_selection ---


// Función para obtener UN modelo específico para un proyecto
export async function getModelForProject(projectId: string, modelId: string): Promise<Model | null> {
  noStore();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('projects_models')
    .select(`
      client_selection,
      models (
        *,
        cover_path,
        portfolio_path,
        gallery_paths
      )
    `)
    .eq('project_id', projectId)
    .eq('model_id', modelId)
    .single();

  if (error || !data) {
    if (error && error.code !== 'PGRST116') {
      logError(error, { action: 'getModelForProject', projectId, modelId });
    }
    return null;
  }

  const modelData = data.models;
  if (!modelData || Array.isArray(modelData) || typeof modelData !== 'object') {
    console.warn(`Invalid specific model data for project ${projectId}, model ${modelId}:`, data);
    return null;
  }

  const modelWithPaths = modelData as unknown as (Model & { cover_path?: string; portfolio_path?: string; gallery_paths?: string[] | null });

  // Se construyen las URLs públicas de R2 directamente.
  const validatedSelection = isValidClientSelection(data.client_selection)
    ? data.client_selection
    : null;

  // Convertir gallery_paths a URLs públicas
  const galleryUrls = (modelWithPaths.gallery_paths || [])
    .map(path => toPublicUrl(path))
    .filter((url): url is string => url !== null);

  return {
    ...modelWithPaths,
    client_selection: validatedSelection,
    coverUrl: toPublicUrl(modelWithPaths.cover_path),
    portfolioUrl: toPublicUrl(modelWithPaths.portfolio_path),
    galleryUrls,
  };
}
