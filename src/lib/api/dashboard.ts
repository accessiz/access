import { createClient } from '@/lib/supabase/server';
import { unstable_noStore as noStore } from 'next/cache';

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
  // @ts-ignore - attach cache to module
  if (!global.__dashboard_counts_cache) global.__dashboard_counts_cache = {};
  // @ts-ignore
  const cache = global.__dashboard_counts_cache[cacheKey];
  if (cache && Date.now() - cache.ts < TTL) {
    // @ts-ignore
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
      console.error('Error fetching project count for status', status, error);
      counts[status] = 0;
    } else {
      counts[status] = count || 0;
    }
  }

  // store in cache
  // @ts-ignore
  global.__dashboard_counts_cache[cacheKey] = { ts: Date.now(), counts };

  return counts;
}

export type ActivityItem = {
  id: string;
  type: 'model' | 'project';
  title: string;
  when: string; // ISO
  meta?: string;
};

export async function getRecentActivity(limit = 5): Promise<ActivityItem[]> {
  noStore();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const [{ data: models }, { data: projects }] = await Promise.all([
    supabase
      .from('models')
      .select('id, alias, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(limit),
    supabase
      .from('projects')
      .select('id, project_name, created_at, updated_at, status')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(limit),
  ] as any);

  const modelItems: ActivityItem[] = (models || []).map((m: any) => ({
    id: m.id,
    type: 'model',
    title: m.alias || 'Sin alias',
    when: m.updated_at || m.created_at,
  }));

  const projectItems: ActivityItem[] = (projects || []).map((p: any) => ({
    id: p.id,
    type: 'project',
    title: p.project_name || 'Proyecto',
    when: p.updated_at || p.created_at,
    meta: p.status,
  }));

  // Merge and sort by when desc
  const merged = [...modelItems, ...projectItems].sort((a, b) => (new Date(b.when).getTime() - new Date(a.when).getTime()));
  return merged.slice(0, limit);
}

export async function getLowCompletenessModels(limit = 5) {
  noStore();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('models')
    .select('id, alias, profile_completeness')
    .eq('user_id', user.id)
    .order('profile_completeness', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching low completeness models', error);
    return [];
  }

  return data || [];
}
