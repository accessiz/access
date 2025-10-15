import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from 'next/cache';
import { Model } from "@/lib/types";

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
    .select('*', { count: 'exact' });

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
    console.error('Error fetching models:', error);
    throw new Error('Could not fetch models data.');
  }

  // --- INICIO DE LA CORRECCIÓN ---
  // Cambiamos getPublicUrl por createSignedUrl para generar URLs seguras y temporales.
  const enrichedData = await Promise.all(
    (data || []).map(async (model) => {
      const imagePath = `${model.id}/Portada/cover.jpg`;
      const { data: signedUrlData, error: signedUrlError } = await supabase
        .storage
        .from(BUCKET_NAME)
        .createSignedUrl(imagePath, 300); // 300 segundos (5 minutos) de validez

      if (signedUrlError) {
        // Si hay un error al firmar (ej. el archivo no existe), no rompemos la app,
        // simplemente no asignamos una URL.
        return { ...model, coverUrl: null };
      }
      
      return { ...model, coverUrl: signedUrlData.signedUrl };
    })
  );
  // --- FIN DE LA CORRECCIÓN ---

  return { data: enrichedData, count: count || 0 };
}

export async function getModelById(id: string): Promise<Model | null> {
  noStore();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('models')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error(`Error fetching model ${id}:`, error);
    }
    return null;
  }

  return data;
}
