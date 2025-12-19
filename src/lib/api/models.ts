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
