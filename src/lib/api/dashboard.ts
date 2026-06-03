import { createClient } from '@/lib/supabase/server';
import { cacheLife, cacheTag } from 'next/cache';
import { logError } from '@/lib/utils/errors';
import { toPublicUrl } from '@/lib/utils';

type ProjectStatusCounts = Record<string, number>;

export async function getProjectStatusCounts(): Promise<ProjectStatusCounts> {
  'use cache: private';
  cacheLife('minutes');
  cacheTag('dashboard', 'project-counts');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};

  const statuses = ['in-review', 'draft', 'sent', 'completed'];
  const counts: ProjectStatusCounts = {};

  // Single query with grouping instead of 4 sequential queries
  const { data, error } = await supabase
    .from('projects')
    .select('status')
    .eq('user_id', user.id)
    .in('status', statuses);

  if (error) {
    logError(error, { action: 'fetch project counts' });
    for (const s of statuses) counts[s] = 0;
  } else {
    // Initialize all statuses to 0, then count from results
    for (const s of statuses) counts[s] = 0;
    for (const row of data || []) {
      counts[row.status] = (counts[row.status] || 0) + 1;
    }
  }

  return counts;
}

export type ActivityItem = {
  id: string;
  type: 'model' | 'project';
  title: string;
  when: string; // ISO
  meta?: string;
  metadata?: {
    entity_id?: string;
    entity_type?: string;
    project_id?: string;
    action?: string;
  };
};

export async function getRecentActivity(limit = 10): Promise<ActivityItem[]> {
  'use cache: private';
  cacheLife('minutes');
  cacheTag('dashboard', 'activity');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Query the activity_logs table for real activity data
  const { data, error } = await supabase
    .from('activity_logs')
    .select('id, category, title, message, created_at, metadata, is_urgent')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    logError(error, { action: 'getRecentActivity' });
    return [];
  }

  if (!data) return [];

  return data.map(log => {
    const metadata = log.metadata as ActivityItem['metadata'] | null;
    return {
      id: log.id,
      type: (log.category === 'project' ? 'project' : 'model') as 'model' | 'project',
      title: log.title,
      when: log.created_at,
      meta: log.message || undefined,
      metadata: metadata || undefined,
    };
  });
}

export async function getLowCompletenessModels(limit = 100) {
  'use cache: private';
  cacheLife('hours');
  cacheTag('dashboard', 'low-completeness');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('models')
    .select(`
      id, alias, profile_completeness, full_name, national_id, phone_e164, email, height_cm,
      gender, birth_date, top_size, pants_size, shoe_size_us, waist_cm, hips_cm,
      shoulders_cm, chest_cm, bust_cm, eye_color, hair_color, instagram
    `)
    .eq('user_id', user.id)
    .lt('profile_completeness', 100)
    .order('profile_completeness', { ascending: true })
    .limit(limit);

  if (error) {
    logError(error, { action: 'getLowCompletenessModels' });
    return [];
  }

  // Calculate missing fields for each model based on the same rules as the DB completeness trigger
  return (data || []).map(m => {
    const missing: string[] = [];
    
    // Critical (8 points each)
    if (!m.full_name) missing.push('Nombre completo');
    if (!m.national_id) missing.push('Documento ID / DPI');
    if (!m.phone_e164) missing.push('Teléfono');
    if (!m.email) missing.push('Correo electrónico');
    if (!m.height_cm || m.height_cm <= 0) missing.push('Altura');

    // Essential (6 points each)
    if (!m.gender) missing.push('Género');
    if (!m.birth_date) missing.push('Fecha de nacimiento');
    if (!m.top_size) missing.push('Talla de Top');
    if (!m.pants_size) missing.push('Talla de Pantalón');
    if (!m.shoe_size_us || m.shoe_size_us <= 0) missing.push('Talla de Zapato');

    // Detailed measurements (3 points each)
    if (!m.waist_cm || m.waist_cm <= 0) missing.push('Cintura');
    if (!m.hips_cm || m.hips_cm <= 0) missing.push('Cadera');
    if (!m.shoulders_cm || m.shoulders_cm <= 0) missing.push('Hombros / Espalda');
    if (!m.chest_cm || m.chest_cm <= 0) missing.push('Pecho');
    if (!m.bust_cm || m.bust_cm <= 0) missing.push('Busto');

    // Social and Appearance (5 points each)
    if (!m.eye_color) missing.push('Color de ojos');
    if (!m.hair_color) missing.push('Color de cabello');
    if (!m.instagram) missing.push('Instagram');

    return { ...m, missing_fields: missing };
  });
}

export type ModelRankingItem = {
  model_id: string;
  alias: string;
  coverUrl: string | null;
  approved_count: number;
  rejected_count: number;
  total_count: number;
  last_project_date: string | null;
};

export type ModelRankings = {
  mostApproved: ModelRankingItem[];
  mostRefused: ModelRankingItem[];
  mostApplied: ModelRankingItem[];
  leastApplied: ModelRankingItem[];
};

export async function getModelApplicationStats(limit = 100): Promise<ModelRankings> {
  'use cache: private';
  cacheLife('minutes');
  cacheTag('dashboard', 'model-stats');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { mostApproved: [], mostRefused: [], mostApplied: [], leastApplied: [] };
  }

  // Use RPC function for efficient SQL aggregation
  const { data, error } = await supabase.rpc('get_model_application_stats');

  if (error) {
    logError(error, { action: 'getModelApplicationStats' });
    return { mostApproved: [], mostRefused: [], mostApplied: [], leastApplied: [] };
  }

  if (!data || data.length === 0) return { mostApproved: [], mostRefused: [], mostApplied: [], leastApplied: [] };

  // Type the response explicitly to include last_project_date
  type StatsRow = {
    model_id: string;
    alias: string | null;
    cover_path: string | null;
    total_count: number;
    approved_count: number;
    rejected_count: number;
    last_project_date: string | null;
  };

  const allStats: ModelRankingItem[] = (data as StatsRow[]).map((row) => ({
    model_id: row.model_id,
    alias: row.alias || 'Sin alias',
    coverUrl: toPublicUrl(row.cover_path),
    approved_count: Number(row.approved_count),
    rejected_count: Number(row.rejected_count),
    total_count: Number(row.total_count),
    last_project_date: row.last_project_date,
  }));

  const mostApproved = [...allStats]
    .sort((a, b) => b.approved_count - a.approved_count)
    .slice(0, limit);

  const mostRefused = [...allStats]
    .sort((a, b) => b.rejected_count - a.rejected_count)
    .slice(0, limit);

  const mostApplied = [...allStats]
    .sort((a, b) => b.total_count - a.total_count)
    .slice(0, limit);

  // Least applied: sorted by total_count ascending (least first), then by last_project_date ascending (oldest first)
  const leastApplied = [...allStats]
    .sort((a, b) => {
      if (a.total_count !== b.total_count) {
        return a.total_count - b.total_count;
      }
      // If same count, prioritize older last_project_date
      const dateA = a.last_project_date ? new Date(a.last_project_date).getTime() : 0;
      const dateB = b.last_project_date ? new Date(b.last_project_date).getTime() : 0;
      return dateA - dateB;
    })
    .slice(0, limit);

  return {
    mostApproved,
    mostRefused,
    mostApplied,
    leastApplied,
  };
}

