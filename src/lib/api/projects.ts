'use server';

import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from 'next/cache';
import { Model, Project } from "@/lib/types";
import { logError } from '@/lib/utils/errors';
import { toPublicUrl } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from "@/lib/supabase/admin";

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
        logger.warn('Fetch failed, retrying', { delay: RETRY_DELAY, retries });
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
  const sortDir = searchParams.sortDir || 'asc';
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
const formatTimeTo12h = (isoString: string) => {
  const date = new Date(isoString);
  let hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  hours = hours ? hours : 12;

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

// Función para obtener un proyecto por ID
export async function getProjectById(idOrPublicId: string): Promise<Project | null> {
  noStore();
  // Usamos supabaseAdmin para saltar RLS en la vista pública
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrPublicId);

  let query = supabaseAdmin
    .from('projects')
    .select('*, project_schedule(*)');

  if (isUUID) {
    query = query.or(`id.eq.${idOrPublicId},public_id.eq.${idOrPublicId}`);
  } else {
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

// Función para obtener modelos de un proyecto
export async function getModelsForProject(projectId: string): Promise<Model[]> {
  noStore();
  
  const { data: projectModelsData, error } = await supabaseAdmin
    .from('projects_models')
    .select(`
      *,
      models (
        *,
        cover_path
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
      logger.warn('Invalid model data in project', { projectId, item });
      return [];
    }
    const model = modelData as unknown as (Model & { cover_path?: string });
    const validatedSelection = isValidClientSelectionInner(item.client_selection)
      ? item.client_selection
      : null;

    return [{
      ...model,
      client_selection: validatedSelection,
      internal_status: item.internal_status,
      agreed_fee: item.agreed_fee,
      trade_fee: item.trade_fee,
      fee_type: item.fee_type,
      currency: item.currency,
      notes: item.notes,
    }];
  });

  const { data: projectSchedules } = await supabaseAdmin
    .from('project_schedule')
    .select('id')
    .eq('project_id', projectId);

  const scheduleIds = projectSchedules?.map((ps: { id: string }) => ps.id) || [];

  if (scheduleIds.length > 0) {
    const { data: assignments } = await supabaseAdmin
      .from('model_assignments')
      .select('*')
      .in('schedule_id', scheduleIds);

    if (assignments) {
      modelsWithPaths.forEach(m => {
        m.assignments = assignments.filter((a: { model_id: string }) => a.model_id === m.id);
      });
    }
  }

  const enriched = modelsWithPaths.map(model => ({
    ...model,
    coverUrl: toPublicUrl(model.cover_path),
  }));

  return enriched;
}

const VALID_CLIENT_SELECTIONS = ['pending', 'approved', 'rejected'] as const;
type ClientSelection = typeof VALID_CLIENT_SELECTIONS[number];

function isValidClientSelection(selection: unknown): selection is ClientSelection {
  if (typeof selection !== 'string') return false;
  return VALID_CLIENT_SELECTIONS.includes(selection as ClientSelection);
}

// Función para obtener UN modelo específico para un proyecto (Versión Cliente - Bypasses RLS)
export async function getModelForProject(projectId: string, modelId: string): Promise<Model | null> {
  noStore();
  
  // Usamos supabaseAdmin para saltar RLS en la vista cliente si es necesario
  // pero aseguramos que la consulta sea lo más completa posible.
  const { data, error } = await supabaseAdmin
    .from('projects_models')
    .select(`
      *,
      models (*)
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

  // Supabase devuelve el registro unido bajo la clave del nombre de la tabla
  // Si por alguna razón es un array, tomamos el primer elemento
  const rawModelData = data.models;
  const rawModel = Array.isArray(rawModelData) ? rawModelData[0] : rawModelData;

  if (!rawModel) {
    logger.warn('No model data found for the project-model link after join', { projectId, modelId });
    return null;
  }

  // Enriquecemos con URLs públicas de R2
  const galleryPaths = (rawModel.gallery_paths as string[]) || [];
  const galleryUrls = galleryPaths
    .map((path: string) => toPublicUrl(path))
    .filter((url: string | null): url is string => url !== null);

  const compCardPaths = (rawModel.comp_card_paths as (string | null)[]) || [null, null, null, null];
  const compCardUrls = compCardPaths.map((path: string | null) => path ? toPublicUrl(path) : null);

  const validatedSelection = isValidClientSelection(data.client_selection)
    ? data.client_selection
    : null;

  // Devolvemos el objeto aplanado que espera la interfaz Model
  const model: Model = {
    ...rawModel, // Campos de la tabla 'models' (height_cm, chest_cm, etc.)
    id: modelId,
    client_selection: validatedSelection,
    internal_status: data.internal_status,
    agreed_fee: data.agreed_fee,
    trade_fee: data.trade_fee,
    fee_type: data.fee_type,
    currency: data.currency,
    notes: data.notes,
    coverUrl: toPublicUrl(rawModel.cover_path),
    galleryUrls,
    compCardUrls,
    // Preservamos los paths originales por si se necesitan
    cover_path: rawModel.cover_path,
    gallery_paths: galleryPaths,
    comp_card_paths: compCardPaths,
  };

  return model;
}
