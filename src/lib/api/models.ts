import { createClient } from '@/lib/supabase/server';
import { unstable_noStore as noStore } from 'next/cache';

interface GetModelsParams {
  query?: string;
  country?: string;
  minHeight?: string;
  maxHeight?: string;
}

/**
 * Fetches a paginated and filtered list of models from the database.
 * @param params - The filter parameters.
 * @returns An object containing the models data and the total count.
 */
export async function getModels({ query, country, minHeight, maxHeight }: GetModelsParams) {
  // Evita que los datos se queden en caché estáticamente,
  // asegurando que los filtros siempre se apliquen en cada request.
  noStore();

  const supabase = createClient();
  let supabaseQuery = supabase
    .from('models')
    .select('*', { count: 'exact' });

  if (query) {
    supabaseQuery = supabaseQuery.ilike('alias', `%${query}%`);
  }
  if (country) {
    supabaseQuery = supabaseQuery.eq('country', country);
  }
  if (minHeight) {
    supabaseQuery = supabaseQuery.gte('height_cm', Number(minHeight));
  }
  if (maxHeight) {
    supabaseQuery = supabaseQuery.lte('height_cm', Number(maxHeight));
  }

  const { data, error, count } = await supabaseQuery.order('alias', { ascending: true });

  if (error) {
    console.error('Error fetching models:', error);
    // En un caso real, podrías querer manejar este error de forma más elegante.
    // Por ahora, lanzamos un error para que el `error.tsx` de Next.js lo capture.
    throw new Error('No se pudieron cargar los modelos.');
  }

  return { data, count };
}

/**
 * Fetches a sorted list of unique countries from the models table.
 * @returns A sorted array of country names.
 */
export async function getUniqueCountries() {
    noStore();
    const supabase = createClient();
    const { data, error } = await supabase
        .from('models')
        .select('country')
        .neq('country', null)
        .order('country', { ascending: true });

    if (error) {
        console.error('Error fetching countries:', error);
        return [];
    }

    // El Set se asegura de que solo tengamos valores únicos.
    return [...new Set(data?.map(item => item.country) || [])];
}
