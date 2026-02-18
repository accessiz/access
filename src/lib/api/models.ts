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

  // Buscar cover en R2 (siempre para asegurar frescura, pero con fallback)
  console.log('[getModelById] Buscando cover en R2...');
  let finalCoverPath = await getFirstFileInFolder(id, 'Portada');
  console.log('[getModelById] Resultado cover R2:', finalCoverPath);

  if (!finalCoverPath && model.cover_path) {
    console.log('[getModelById] Fallback: Usando cover_path de la DB:', model.cover_path);
    finalCoverPath = model.cover_path;
  }

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
  console.log('[getModelById] coverUrl generado:', coverUrl, 'desde path:', finalCoverPath);
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
    default_model_fee: number | null;  // Project default cash fee
    default_model_trade_fee: number | null;  // Project default trade fee
    default_model_payment_type: 'cash' | 'trade' | 'mixed' | null;  // Project payment type
    clients: { name: string } | null;
    brands: { name: string } | null;
  }

  interface ProjectModelRow {
    agreed_fee: number | null;
    trade_fee: number | null;  // Trade fee
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
    amount_gtq: number | null;
    exchange_rate_used: number | null;
    adjustment_amount: number | null;
    adjustment_amount_trade: number | null;
    adjustment_reason: string | null;
    adjustment_reason_trade: string | null;
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
      trade_fee,
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
        default_model_fee,
        default_model_trade_fee,
        default_model_payment_type,
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
      amount_gtq,
      exchange_rate_used,
      adjustment_amount,
      adjustment_amount_trade,
      adjustment_reason,
      adjustment_reason_trade,
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

      // Use project's payment type as the source of truth
      const projectPaymentType = project.default_model_payment_type || 'cash';

      // Get raw values
      const rawFee = pm.agreed_fee || projectAssignments[0]?.daily_fee || project.default_model_fee || 0;
      const rawTradeFee = pm.trade_fee || project.default_model_trade_fee || 0;

      // Apply payment type filter - only show values that match the payment type
      const fee = projectPaymentType === 'trade' ? 0 : rawFee;
      const tradeFee = projectPaymentType === 'cash' ? 0 : rawTradeFee;

      // Días trabajados: usar asignaciones si hay, sino usar schedules del proyecto
      const daysWorked = totalAssignments > 0 ? totalAssignments : dates.length || 1;

      // --- Calculate Adjustments ---
      // We assume adjustments are per day, or we sum them up if they are stored in assignments
      // Based on previous context, adjustments are stored in model_assignments table

      const totalAdjustmentAmount = projectAssignments.reduce((acc, curr) => acc + (curr.adjustment_amount || 0), 0);
      const totalAdjustmentAmountTrade = projectAssignments.reduce((acc, curr) => acc + (curr.adjustment_amount_trade || 0), 0);

      // Get the first non-null reason if any
      const adjustmentReason = projectAssignments.find(a => a.adjustment_reason)?.adjustment_reason || null;
      const adjustmentReasonTrade = projectAssignments.find(a => a.adjustment_reason_trade)?.adjustment_reason_trade || null;

      const totalAmount = (fee * daysWorked) + totalAdjustmentAmount;
      const totalTradeAmount = (tradeFee * daysWorked) + totalAdjustmentAmountTrade;

      // Calculate Total Paid GTQ
      // Sum amount_gtq for paid assignments
      const totalPaidGTQ = projectAssignments
        .filter(a => a.payment_status === 'paid' && a.amount_gtq)
        .reduce((sum, a) => sum + (a.amount_gtq || 0), 0);

      // Payment type is from the project configuration
      const paymentType: 'cash' | 'trade' | 'mixed' = projectPaymentType;

      return {
        projectId: project.id,
        projectName: project.project_name,
        clientName: project.clients?.name || project.client_name,
        brandName: project.brands?.name || null,
        projectStatus: project.status,
        clientSelection: pm.client_selection || 'pending',
        createdAt: project.created_at,
        agreedFee: fee,
        tradeFee: tradeFee,  // Trade fee per day
        totalTradeAmount: totalTradeAmount > 0 || projectPaymentType !== 'cash' ? totalTradeAmount : null,
        paymentType,  // Payment type: cash, trade, or mixed
        feeType: pm.fee_type || 'per_day',
        currency: pm.currency || 'GTQ',
        daysWorked,
        totalAmount,
        totalPaidGTQ: totalPaidGTQ > 0 ? totalPaidGTQ : null,
        paymentStatus,
        lastPaymentDate,
        firstWorkDate,
        lastWorkDate,
        assignments: projectAssignments,
        // Add adjustment info to return object
        adjustmentAmount: totalAdjustmentAmount,
        adjustmentAmountTrade: totalAdjustmentAmountTrade,
        adjustmentReason,
        adjustmentReasonTrade
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Get the IDs of models that are "busy" RIGHT NOW
 * 
 * A model is considered busy if:
 * 1. Has an assignment for today's date (Guatemala timezone)
 * 2. Current time is within the project's schedule (start_time <= now < end_time)
 * 3. Was approved by the client (client_selection = 'approved')
 * 4. Project is active (not 'completed' or 'archived')
 * 
 * @returns Map<string, string> of busy model IDs to their active project IDs
 */
export async function getBusyModelsToday(): Promise<Map<string, string>> {
  noStore();
  const supabase = await createClient();

  // Get current datetime in Guatemala timezone (GMT-6)
  const guatemalaTime = new Date().toLocaleString('en-US', { timeZone: 'America/Guatemala' });
  const now = new Date(guatemalaTime);
  const today = now.toISOString().split('T')[0];

  // Format current time for comparison with timestamps
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const currentTimeStr = `${today}T${hours}:${minutes}:00`;

  // Step 1: Get all model_assignments for today with schedule info (including end_time)
  const { data: assignments, error: assignmentsError } = await supabase
    .from('model_assignments')
    .select(`
      model_id,
      project_schedule!inner(project_id, start_time, end_time)
    `)
    .gte('project_schedule.start_time', `${today}T00:00:00`)
    .lt('project_schedule.start_time', `${today}T23:59:59`);

  if (assignmentsError || !assignments || assignments.length === 0) {
    if (assignmentsError) {
      logError(assignmentsError, { action: 'getBusyModelsToday.assignments', today });
    }
    return new Map();
  }

  // Extract unique project IDs and model IDs
  type AssignmentRow = { model_id: string; project_schedule: { project_id: string; start_time: string; end_time: string } };
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
    return new Map();
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
    return new Map();
  }

  // Create a set of "model_id:project_id" combinations that are approved
  const approvedCombos = new Set(
    (approvedModels || []).map(pm => `${pm.model_id}:${pm.project_id}`)
  );

  // Step 4: Filter assignments to only include:
  // - Approved models in active projects
  // - Current time is within the schedule (start_time <= now < end_time)
  const busyModelMap = new Map<string, string>();
  for (const assignment of typedAssignments) {
    const projectId = assignment.project_schedule.project_id;
    const modelId = assignment.model_id;
    const startTime = assignment.project_schedule.start_time;
    const endTime = assignment.project_schedule.end_time;

    // Check if current time is within the schedule
    const isWithinSchedule = currentTimeStr >= startTime && currentTimeStr < endTime;

    // Check if project is active AND model is approved AND within schedule time
    if (activeProjectIds.has(projectId) &&
      approvedCombos.has(`${modelId}:${projectId}`) &&
      isWithinSchedule) {
      busyModelMap.set(modelId, projectId);
    }
  }

  return busyModelMap;
}
