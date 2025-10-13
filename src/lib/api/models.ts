import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from 'next/cache';
import { Model } from "@/lib/types";

// Tipado para los parámetros de búsqueda
type SearchParams = {
  query?: string;
  minHeight?: number;
  maxHeight?: number;
  sortDir?: 'asc' | 'desc';
};

// La versión ANTERIOR de esta función tenía un problema N+1.
// Hacía una llamada a la base de datos por CADA modelo para calcular
// el `profile_completion`.

// Esta NUEVA versión es increíblemente más eficiente.
// El valor de `profile_completion` ahora es pre-calculado por un trigger
// en la base de datos, por lo que solo necesitamos hacer UNA ÚNICA llamada
// para obtener todos los datos.

export async function getModelsEnriched(searchParams: SearchParams): Promise<Model[]> {
  noStore();
  const supabase = createClient();

  let queryBuilder = supabase
    .from('models')
    .select('*');

  // Aplicar filtros de búsqueda si existen
  if (searchParams.query) {
    // Busca en múltiples columnas con 'or'
    queryBuilder = queryBuilder.or(
      `alias.ilike.%${searchParams.query}%,full_name.ilike.%${searchParams.query}%`
    );
  }

  // Aplicar filtros de altura
  if (searchParams.minHeight) {
    queryBuilder = queryBuilder.gte('height_cm', searchParams.minHeight);
  }
  if (searchParams.maxHeight) {
    queryBuilder = queryBuilder.lte('height_cm', searchParams.maxHeight);
  }

  // Aplicar ordenamiento
  const sortDir = searchParams.sortDir || 'desc';
  queryBuilder = queryBuilder.order('created_at', { ascending: sortDir === 'asc' });

  // Ejecutar la consulta
  const { data, error } = await queryBuilder;

  if (error) {
    console.error('Error fetching models:', error);
    throw new Error('Could not fetch models data.');
  }

  // ¡Ya no hay necesidad de enriquecer los datos! Todo viene de la BD.
  // El tipo 'Model' ya debería incluir la propiedad opcional 'profile_completion'
  return data || [];
}
