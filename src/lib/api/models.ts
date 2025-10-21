import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from 'next/cache';
import { Model } from "@/lib/types";
import { logError } from '@/lib/utils/errors';

const BUCKET_NAME = 'Book_Completo_iZ_Management';
const ITEMS_PER_PAGE = 24;

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

  if (searchParams.query) {
    const searchQuery = `${searchParams.query}%`;
    queryBuilder = queryBuilder.or(
      `alias.ilike.${searchQuery},full_name.ilike.${searchQuery}`
    );
  }
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
    // Return a safe empty response instead of throwing to avoid uncaught exceptions
    return { data: [], count: 0 };
  }

  // En lugar de listar Storage por cada modelo (N+1), recolectamos las rutas cover_path
  // y las firmamos en lote con createSignedUrls.
  const rows = data || [];
  const pathsToSign: string[] = [];
  for (const row of rows) {
    if (row.cover_path) pathsToSign.push(row.cover_path);
  }

  const signedUrlMap = new Map<string, string>();
  if (pathsToSign.length > 0) {
    const { data: signedUrlsData, error: signError } = await supabase.storage.from(BUCKET_NAME).createSignedUrls(pathsToSign, 300);
    if (signError) {
      logError(signError, { action: 'batch sign model covers', pathsToSign });
    } else if (signedUrlsData) {
      for (const item of signedUrlsData) {
        if (item.path && item.signedUrl) signedUrlMap.set(item.path, item.signedUrl);
      }
    }
  }

  const enrichedData = rows.map((model: Model & { cover_path?: string | null }) => ({
    ...model,
    coverUrl: model.cover_path ? signedUrlMap.get(model.cover_path) || null : null,
  }));

  return { data: enrichedData, count: count || 0 };
}

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

  // Enrich model with signed URLs for images (cover, portfolio, comp cards)
  const model = data as Model & {
    cover_path?: string | null;
    portfolio_path?: string | null;
    comp_card_paths?: (string | null)[];
  };

  const pathsToSign: string[] = [];
  const coverPath = model.cover_path || null;
  const portfolioPath = model.portfolio_path || null;
  const compCardPaths = (model.comp_card_paths || []).slice(0, 4);

  if (coverPath) pathsToSign.push(coverPath);
  if (portfolioPath) pathsToSign.push(portfolioPath);
  for (const p of compCardPaths) if (p) pathsToSign.push(p as string);

  const signedUrlMap = new Map<string, string>();
  if (pathsToSign.length > 0) {
    const { data: signedUrlsData, error: signError } = await supabase.storage.from(BUCKET_NAME).createSignedUrls(pathsToSign, 300);
    if (signError) {
      logError(signError, { action: 'getModelById.batch sign urls', id, pathsToSign });
    } else if (signedUrlsData) {
      for (const item of signedUrlsData) {
        if (item.path && item.signedUrl) signedUrlMap.set(item.path, item.signedUrl);
      }
    }
  }

  const coverUrl = coverPath ? signedUrlMap.get(coverPath) || null : null;
  const portfolioUrl = portfolioPath ? signedUrlMap.get(portfolioPath) || null : null;
  const compCardUrls = compCardPaths.map(p => p ? signedUrlMap.get(p as string) || null : null);

  return {
    ...model,
    coverUrl,
    portfolioUrl,
    compCardUrls,
  };
}