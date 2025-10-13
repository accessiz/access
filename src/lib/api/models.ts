import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from 'next/cache';
import { Model } from "@/lib/types";

// Cantidad de resultados por página (debe coincidir con el frontend)
const ITEMS_PER_PAGE = 24;

// Tipado para los parámetros de búsqueda que vienen de la URL
type SearchParams = {
  query?: string;
  country?: string;
  minHeight?: string;
  maxHeight?: string;
  sortKey?: keyof Model;
  sortDir?: 'asc' | 'desc';
  currentPage?: number;
};

/**
 * Obtiene los modelos de la base de datos aplicando filtros, ordenamiento y paginación.
 * Esta versión es eficiente porque obtiene los datos y el conteo total en una sola llamada.
 * @param searchParams Los filtros y opciones de la URL.
 * @returns Un objeto con la lista de modelos (`data`) y el conteo total (`count`).
 */
export async function getModelsEnriched(searchParams: SearchParams) {
  noStore(); // Evita que Next.js cachee los resultados de esta función
  const supabase = createClient();
  const currentPage = searchParams.currentPage || 1;

  // Empezamos a construir la consulta. Pedimos los datos Y el conteo total.
  let queryBuilder = supabase
    .from('models')
    .select('*', { count: 'exact' });

  // 1. Aplicar Filtros
  if (searchParams.query) {
    queryBuilder = queryBuilder.or(`alias.ilike.%${searchParams.query}%,full_name.ilike.%${searchParams.query}%`);
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

  // 2. Aplicar Ordenamiento
  const sortKey = searchParams.sortKey || 'alias';
  const sortDir = searchParams.sortDir || 'asc';
  queryBuilder = queryBuilder.order(sortKey, { ascending: sortDir === 'asc' });

  // 3. Aplicar Paginación
  const from = (currentPage - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;
  queryBuilder = queryBuilder.range(from, to);

  // 4. Ejecutar la consulta final
  const { data, error, count } = await queryBuilder;

  if (error) {
    console.error('Error fetching models:', error);
    throw new Error('Could not fetch models data.');
  }

  // Devolvemos tanto los datos de la página actual como el conteo total
  return { data: data || [], count: count || 0 };
}

// También actualizamos la función para obtener un solo modelo por ID
export async function getModelById(id: string): Promise<Model | null> {
    noStore();
    const supabase = createClient();
    const { data, error } = await supabase
        .from('models')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error(`Error fetching model ${id}:`, error);
        return null;
    }

    return data;
}
