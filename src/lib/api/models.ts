import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from 'next/cache';
import { Model } from "@/lib/types";

const ITEMS_PER_PAGE = 24;

type SearchParams = {
  query?: string;
  country?: string;
  minHeight?: string;
  maxHeight?: string;
  sortKey?: keyof Model;
  sortDir?: 'asc' | 'desc';
  currentPage?: number;
  limit?: number; // 👈 añadido
};

/**
 * Obtiene los modelos con filtros, ordenamiento y paginación.
 */
export async function getModelsEnriched(searchParams: SearchParams) {
  noStore();

  const supabase = await createClient();

  const currentPage = searchParams.currentPage || 1;
  const limit = searchParams.limit || ITEMS_PER_PAGE; // 👈 usa el limit enviado por el frontend

  // 1️⃣ Construcción base
  let queryBuilder = supabase
    .from('models')
    .select('*', { count: 'exact' });

  // 2️⃣ Filtros
  if (searchParams.query) {
    queryBuilder = queryBuilder.or(
      `alias.ilike.%${searchParams.query}%,full_name.ilike.%${searchParams.query}%`
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

  // 3️⃣ Ordenamiento
  const sortKey = searchParams.sortKey || 'alias';
  const sortDir = searchParams.sortDir || 'asc';
  queryBuilder = queryBuilder.order(sortKey, { ascending: sortDir === 'asc' });

  // 4️⃣ Paginación
  const from = (currentPage - 1) * limit;
  const to = from + limit - 1;
  queryBuilder = queryBuilder.range(from, to);

  // 5️⃣ Ejecutar
  const { data, error, count } = await queryBuilder;
  if (error) {
    console.error('Error fetching models:', error);
    throw new Error('Could not fetch models data.');
  }

  // 6️⃣ (Opcional pero recomendable) Generar URL de portada
  const enrichedData = await Promise.all(
    (data || []).map(async (model) => {
      const { data: img } = await supabase.storage
        .from("Book_Completo_iZ_Management")
        .getPublicUrl(`${model.id}/Portada/cover.jpg`);
      return { ...model, coverUrl: img?.publicUrl || null };
    })
  );

  return { data: enrichedData, count: count || 0 };
}

/**
 * Obtiene un modelo por ID
 */
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
