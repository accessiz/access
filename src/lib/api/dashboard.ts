import { createClient } from '@/lib/supabase/server';
import { unstable_noStore as noStore } from 'next/cache';
import { logError } from '@/lib/utils/errors';

type ProjectStatusCounts = Record<string, number>;

export async function getProjectStatusCounts(): Promise<ProjectStatusCounts> {
  noStore();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};

  // Simple in-memory TTL cache (works in long-lived server processes).
  // TTL: 30 seconds to avoid frequent DB calls.
  const TTL = 30 * 1000;
  const cacheKey = user.id;
  type DashboardCache = Record<string, { ts: number; counts: ProjectStatusCounts } | undefined>;
  const g = globalThis as unknown as { __dashboard_counts_cache?: DashboardCache };
  if (!g.__dashboard_counts_cache) g.__dashboard_counts_cache = {};
  const cache = g.__dashboard_counts_cache[cacheKey];
  if (cache && Date.now() - cache.ts < TTL) {
    return cache.counts;
  }

  const statuses = ['in-review', 'draft', 'sent', 'completed'];
  const counts: ProjectStatusCounts = {};

  for (const status of statuses) {
    const { count, error } = await supabase
      .from('projects')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('status', status);
    if (error) {
      logError(error, { action: 'fetch project count', status });
      counts[status] = 0;
    } else {
      counts[status] = count || 0;
    }
  }

  // store in cache
  g.__dashboard_counts_cache[cacheKey] = { ts: Date.now(), counts };

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
  noStore();
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

export async function getLowCompletenessModels(limit = 5) {
  noStore();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('models')
    .select('id, alias, profile_completeness, birth_date, cover_path, height_cm, portfolio_path')
    .eq('user_id', user.id)
    .order('profile_completeness', { ascending: true })
    .limit(limit);

  if (error) {
    logError(error, { action: 'getLowCompletenessModels' });
    return [];
  }

  // Calculate missing fields for each model
  return (data || []).map(m => {
    const missing: string[] = [];
    if (!m.birth_date) missing.push('Fecha de nacimiento');
    if (!m.cover_path) missing.push('Foto de portada');
    if (!m.height_cm) missing.push('Altura');
    if (!m.portfolio_path) missing.push('Portfolio');
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
  noStore();
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

  const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL?.replace(/\/$/, '') || '';
  const toPublicUrl = (path: string | null | undefined) => path && R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${path}` : null;

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

