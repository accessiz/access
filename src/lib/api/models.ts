import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from 'next/cache';
import { Model } from "@/lib/types";
import { logError } from '@/lib/utils/errors';
import { getGuatemalaTodayString } from '@/lib/constants/finance';

// const BUCKET_NAME = 'Book_Completo_iZ_Management'; // Ya no se usa para generar URLs
const ITEMS_PER_PAGE = 24;

// --- INICIO DE LA CORRECCIÓN ---
// Helper para construir la URL pública de R2
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL?.replace(/\/$/, '') || '';

const toPublicUrl = (path: string | null | undefined): string | null => {
  if (!path || !R2_PUBLIC_URL) return null;
  // Construye la URL pública. La codificación no es estrictamente necesaria si los nombres de archivo son seguros.
  return `${R2_PUBLIC_URL}/${path}`;
};
// --- FIN DE LA CORRECCIÓN ---

type SearchParams = {
  query?: string;
  country?: string;
  minHeight?: string;
  maxHeight?: string;
  sortKey?: keyof Model;
  sortDir?: 'asc' | 'desc';
  currentPage?: number;
  limit?: number;
};

export async function getModelsEnriched(searchParams: SearchParams) {
  noStore();
  const supabase = await createClient();
  const currentPage = searchParams.currentPage || 1;
  const limit = searchParams.limit || ITEMS_PER_PAGE;

  let queryBuilder = supabase
    .from('models')
    .select('*, cover_path', { count: 'exact' });

  // --- BLOQUE DE BÚSQUEDA FTS ---
  if (searchParams.query) {
    const searchQuery = searchParams.query.trim()
      .split(/\s+/)
      .filter(term => term.length > 0)
      .map(term => term + ':*')
      .join(' & ');

    if (searchQuery) {
      queryBuilder = queryBuilder.textSearch(
        'fts_search_vector',
        searchQuery,
        {
          config: 'spanish_unaccent'
        }
      );
    }
  }
  // --- FIN BLOQUE DE BÚSQUEDA FTS ---

  if (searchParams.country) {
    queryBuilder = queryBuilder.eq('country', searchParams.country);
  }
  if (searchParams.minHeight) {
    queryBuilder = queryBuilder.gte('height_cm', Number(searchParams.minHeight));
  }
  if (searchParams.maxHeight) {
    queryBuilder = queryBuilder.lte('height_cm', Number(searchParams.maxHeight));
  }

  const sortKey = searchParams.sortKey || 'alias';
  const sortDir = searchParams.sortDir || 'asc';
  queryBuilder = queryBuilder.order(sortKey, { ascending: sortDir === 'asc' });

  const from = (currentPage - 1) * limit;
  const to = from + limit - 1;
  queryBuilder = queryBuilder.range(from, to);

  const { data, error, count } = await queryBuilder;

  if (error) {
    logError(error, { action: 'getModelsEnriched.query', searchParams });
    return { data: [], count: 0 };
  }

  const rows = data || [];

  // --- INICIO DE LA CORRECCIÓN ---
  // Se elimina la lógica de `createSignedUrls`.
  // Se mapean los resultados para construir la `coverUrl` pública de R2.
  const enrichedData = rows.map((model: Model & { cover_path?: string | null }) => ({
    ...model,
    coverUrl: toPublicUrl(model.cover_path),
  }));
  // --- FIN DE LA CORRECCIÓN ---

  return { data: enrichedData, count: count || 0 };
}

// getModelById - Ahora busca en R2 si los paths no existen en la DB
export async function getModelById(id: string): Promise<(Model & {
  coverUrl?: string | null;
  portfolioUrl?: string | null;
  compCardUrls?: (string | null)[];
  cover_path?: string | null;
  portfolio_path?: string | null;
  comp_card_paths?: (string | null)[];
  galleryUrls?: (string | null)[];
  galleryPaths?: string[] | null;
}) | null> {
  noStore();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('models')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      logError(error, { action: 'getModelById', id });
    }
    return null;
  }

  const model = data as Model & {
    cover_path?: string | null;
    portfolio_path?: string | null;
    comp_card_paths?: (string | null)[];
  };

  console.log('[getModelById] Model ID:', id);
  console.log('[getModelById] cover_path en DB:', model.cover_path);

  // --- INICIO: BÚSQUEDA DINÁMICA EN R2 ---
  // SIEMPRE buscamos en R2 para cover y portfolio porque el cover_path de la DB
  // puede no coincidir con el nombre real del archivo en R2
  const { getFirstFileInFolder } = await import('@/lib/actions/storage');

  // Buscar cover en R2 (siempre, ignorando el valor de la DB)
  console.log('[getModelById] Buscando cover en R2...');
  const finalCoverPath = await getFirstFileInFolder(id, 'Portada');
  console.log('[getModelById] Resultado cover R2:', finalCoverPath);

  // Buscar portfolio en R2 solo si no hay valor en la DB
  let finalPortfolioPath = model.portfolio_path;
  if (!finalPortfolioPath) {
    console.log('[getModelById] Buscando portfolio en R2...');
    finalPortfolioPath = await getFirstFileInFolder(id, 'Portfolio');
    console.log('[getModelById] Resultado portfolio R2:', finalPortfolioPath);
  }
  // --- FIN: BÚSQUEDA DINÁMICA EN R2 ---

  // Se construyen las URLs públicas de R2
  const coverUrl = toPublicUrl(finalCoverPath);
  const portfolioUrl = toPublicUrl(finalPortfolioPath);
  const compCardUrls = (model.comp_card_paths || []).slice(0, 4).map(p => toPublicUrl(p));
  const galleryPaths = model.gallery_paths || [];
  const galleryUrls = galleryPaths.map(p => toPublicUrl(p)).filter((url): url is string => url !== null);

  console.log('[getModelById] coverUrl final:', coverUrl);

  return {
    ...model,
    cover_path: finalCoverPath,
    portfolio_path: finalPortfolioPath,
    coverUrl,
    portfolioUrl,
    compCardUrls,
    galleryUrls,
    galleryPaths,
  };
}

export async function getModelWorkHistory(modelId: string) {
  noStore();
  const supabase = await createClient();

  // Type definitions for query results
  interface ProjectData {
    id: string;
    project_name: string;
    client_name: string | null;
    status: string;
    created_at: string;
    clients: { name: string } | null;
    brands: { name: string } | null;
  }

  interface ProjectModelRow {
    agreed_fee: number | null;
    fee_type: string | null;
    currency: string | null;
    internal_status: string | null;
    client_selection: string | null;
    projects: ProjectData | null;
  }

  interface AssignmentRow {
    id: string;
    schedule_id: string | null;
    payment_status: string | null;
    payment_date: string | null;
    daily_fee: number | null;
    project_schedule: {
      project_id: string;
      start_time: string;  // ISO timestamp, e.g. "2026-01-06T10:00:00+00:00"
      end_time: string;
    } | null;
  }

  // 1. Obtener proyectos donde el modelo está asignado (projects_models)
  const { data, error } = await supabase
    .from('projects_models')
    .select(`
      agreed_fee,
      fee_type,
      currency,
      internal_status,
      client_selection,
      projects!projects_models_project_id_fkey (
        id,
        project_name,
        client_name,
        status,
        created_at,
        clients (name),
        brands (name)
      )
    `)
    .eq('model_id', modelId);

  if (error) {
    logError(error, { action: 'getModelWorkHistory.projects_models', modelId });
    return [];
  }

  // 2. Obtener todas las asignaciones detalladas del modelo para contar días y estados de pago
  const { data: assignments, error: assignmentsError } = await supabase
    .from('model_assignments')
    .select(`
      id,
      schedule_id,
      payment_status,
      payment_date,
      daily_fee,
      project_schedule (
        project_id,
        start_time,
        end_time
      )
    `)
    .eq('model_id', modelId);

  if (assignmentsError) {
    logError(assignmentsError, { action: 'getModelWorkHistory.assignments', modelId });
  }

  // 3. Obtener los schedules de todos los proyectos del modelo como fallback
  const typedData = (data || []) as unknown as ProjectModelRow[];
  const projectIds = typedData.map(pm => pm.projects?.id).filter(Boolean) as string[];

  interface ScheduleRow {
    project_id: string;
    start_time: string;
    end_time: string;
  }

  let projectSchedules: ScheduleRow[] = [];
  if (projectIds.length > 0) {
    const { data: scheduleData } = await supabase
      .from('project_schedule')
      .select('project_id, start_time, end_time')
      .in('project_id', projectIds);
    projectSchedules = (scheduleData || []) as ScheduleRow[];
  }

  const typedAssignments = (assignments || []) as unknown as AssignmentRow[];

  // 4. Cruzar los datos y calcular estados de pago consolidados
  return typedData
    .filter((pm) => pm.projects)
    .map((pm) => {
      const project = pm.projects!;
      // Asignaciones de este modelo en este proyecto
      const projectAssignments = typedAssignments.filter(
        (a) => a.project_schedule?.project_id === project.id
      );

      // Calcular estado de pago consolidado
      const paidCount = projectAssignments.filter((a) => a.payment_status === 'paid').length;
      const totalAssignments = projectAssignments.length;

      let paymentStatus: 'pending' | 'paid' | 'partial' = 'pending';
      if (totalAssignments > 0) {
        if (paidCount === totalAssignments) {
          paymentStatus = 'paid';
        } else if (paidCount > 0) {
          paymentStatus = 'partial';
        }
      }

      // Fechas del proyecto - extraer fecha del timestamp start_time
      // Primero intentar de las asignaciones individuales
      let dates = projectAssignments
        .map((a) => {
          const startTime = a.project_schedule?.start_time;
          if (!startTime) return null;
          return startTime.split('T')[0];
        })
        .filter((d): d is string => d !== null)
        .sort();

      // Fallback: si no hay asignaciones individuales, usar schedules del proyecto
      if (dates.length === 0) {
        dates = projectSchedules
          .filter(s => s.project_id === project.id)
          .map(s => s.start_time.split('T')[0])
          .filter((d): d is string => d !== null)
          .sort();
      }

      const firstWorkDate = dates[0] || null;
      const lastWorkDate = dates[dates.length - 1] || null;

      // Último pago
      const lastPaymentDate = projectAssignments
        .filter((a) => a.payment_date)
        .map((a) => a.payment_date)
        .sort()
        .pop() || null;

      // Total calculado
      const fee = pm.agreed_fee || projectAssignments[0]?.daily_fee || 0;
      // Días trabajados: usar asignaciones si hay, sino usar schedules del proyecto
      const daysWorked = totalAssignments > 0 ? totalAssignments : dates.length || 1;
      const totalAmount = fee * daysWorked;

      return {
        projectId: project.id,
        projectName: project.project_name,
        clientName: project.clients?.name || project.client_name,
        brandName: project.brands?.name || null,
        projectStatus: project.status,
        clientSelection: pm.client_selection || 'pending',
        createdAt: project.created_at,
        agreedFee: fee,
        feeType: pm.fee_type || 'per_day',
        currency: pm.currency || 'GTQ',
        daysWorked,
        totalAmount,
        paymentStatus,
        lastPaymentDate,
        firstWorkDate,
        lastWorkDate,
        assignments: projectAssignments
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Get the IDs of models that are "busy" TODAY
 * 
 * A model is considered busy if:
 * 1. Has an assignment for today's date (Guatemala timezone)
 * 2. Was approved by the client (client_selection = 'approved')
 * 3. Project is active (not 'completed' or 'archived')
 * 
 * @returns Set<string> of busy model IDs
 */
export async function getBusyModelsToday(): Promise<Set<string>> {
  noStore();
  const supabase = await createClient();

  // Get today's date in Guatemala timezone (YYYY-MM-DD)
  const today = getGuatemalaTodayString();

  // Step 1: Get all model_assignments for today with schedule info
  const { data: assignments, error: assignmentsError } = await supabase
    .from('model_assignments')
    .select(`
      model_id,
      project_schedule!inner(project_id, start_time)
    `)
    .gte('project_schedule.start_time', `${today}T00:00:00`)
    .lt('project_schedule.start_time', `${today}T23:59:59`);

  if (assignmentsError || !assignments || assignments.length === 0) {
    if (assignmentsError) {
      logError(assignmentsError, { action: 'getBusyModelsToday.assignments', today });
    }
    return new Set();
  }

  // Extract unique project IDs and model IDs
  type AssignmentRow = { model_id: string; project_schedule: { project_id: string; start_time: string } };
  const typedAssignments = assignments as unknown as AssignmentRow[];
  const projectIds = [...new Set(typedAssignments.map(a => a.project_schedule.project_id))];
  const modelIds = [...new Set(typedAssignments.map(a => a.model_id))];

  // Step 2: Get projects that are active (not completed/archived)
  const { data: activeProjects, error: projectsError } = await supabase
    .from('projects')
    .select('id')
    .in('id', projectIds)
    .not('status', 'in', '("completed","archived")');

  if (projectsError) {
    logError(projectsError, { action: 'getBusyModelsToday.projects', today });
    return new Set();
  }

  const activeProjectIds = new Set((activeProjects || []).map(p => p.id));

  // Step 3: Get approved models in these projects
  const { data: approvedModels, error: approvedError } = await supabase
    .from('projects_models')
    .select('model_id, project_id')
    .in('model_id', modelIds)
    .in('project_id', projectIds)
    .eq('client_selection', 'approved');

  if (approvedError) {
    logError(approvedError, { action: 'getBusyModelsToday.approved', today });
    return new Set();
  }

  // Create a set of "model_id:project_id" combinations that are approved
  const approvedCombos = new Set(
    (approvedModels || []).map(pm => `${pm.model_id}:${pm.project_id}`)
  );

  // Step 4: Filter assignments to only include approved models in active projects
  const busyModelIds = new Set<string>();
  for (const assignment of typedAssignments) {
    const projectId = assignment.project_schedule.project_id;
    const modelId = assignment.model_id;

    // Check if project is active AND model is approved for this project
    if (activeProjectIds.has(projectId) && approvedCombos.has(`${modelId}:${projectId}`)) {
      busyModelIds.add(modelId);
    }
  }

  return busyModelIds;
}
