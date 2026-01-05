import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from 'next/cache';
import { Model } from "@/lib/types";
import { logError } from '@/lib/utils/errors';

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

// getModelById remains unchanged
export async function getModelById(id: string): Promise<(Model & {
  coverUrl?: string | null;
  portfolioUrl?: string | null;
  compCardUrls?: (string | null)[];
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

  // --- INICIO DE LA CORRECCIÓN ---
  // Se elimina la lógica de `createSignedUrls`.
  // Se construyen las URLs públicas de R2 directamente.
  const coverUrl = toPublicUrl(model.cover_path);
  const portfolioUrl = toPublicUrl(model.portfolio_path);
  const compCardUrls = (model.comp_card_paths || []).slice(0, 4).map(p => toPublicUrl(p));
  // --- FIN DE LA CORRECCIÓN ---

  return {
    ...model,
    coverUrl,
    portfolioUrl,
    compCardUrls,
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
      start_time: string;
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

  const typedData = (data || []) as unknown as ProjectModelRow[];
  const typedAssignments = (assignments || []) as unknown as AssignmentRow[];

  // 3. Cruzar los datos y calcular estados de pago consolidados
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

      // Fechas del proyecto
      const dates = projectAssignments
        .map((a) => a.project_schedule?.start_time)
        .filter(Boolean)
        .sort();

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
      const daysWorked = totalAssignments || 1;
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
 * Get the IDs of models that have assignments for TODAY
 * 
 * Simple availability check:
 * - Returns Set of model IDs that are "busy" today
 * - A model is busy if they have any assignment for today's date
 * 
 * @returns Set<string> of busy model IDs
 */
export async function getBusyModelsToday(): Promise<Set<string>> {
  noStore();
  const supabase = await createClient();

  // Get today's date in ISO format (YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0];

  // Query: Get all model_assignments where the related schedule has today's date
  const { data, error } = await supabase
    .from('model_assignments')
    .select(`
      model_id,
      project_schedule!inner(date)
    `)
    .eq('project_schedule.date', today);

  if (error) {
    logError(error, { action: 'getBusyModelsToday', today });
    return new Set();
  }

  // Extract unique model IDs
  const busyModelIds = new Set<string>();
  for (const row of data || []) {
    if (row.model_id) {
      busyModelIds.add(row.model_id);
    }
  }

  return busyModelIds;
}
