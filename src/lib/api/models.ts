
import { createClient } from '@/lib/supabase/server';
import { unstable_noStore as noStore } from 'next/cache';
import { Model } from '@/lib/types';

/**
 * Calcula el porcentaje de completado de un perfil de modelo.
 * @param model - El objeto del modelo de la base de datos.
 * @param files - Una lista de archivos del storage de Supabase para ese modelo.
 * @returns Un número entre 0 y 100.
 */
function calculateProfileCompletion(model: Model, files: { name: string }[]): number {
  let score = 0;
  const DATA_WEIGHT = 60; // 60% del puntaje viene de los datos.
  const PHOTOS_WEIGHT = 40; // 40% del puntaje viene de las fotos.

  // --- Cálculo de Datos (60%) ---
  const essentialDataFields: (keyof Model)[] = [
    'alias', 'full_name', 'birth_date', 'country', 'height_cm', 
    'shoulders_cm', 'bust_cm', 'waist_cm', 'hips_cm', 'top_size', 
    'pants_size', 'shoe_size_eu', 'instagram'
  ];
  const filledDataFields = essentialDataFields.filter(field => model[field] != null && model[field] !== '').length;
  score += (filledDataFields / essentialDataFields.length) * DATA_WEIGHT;

  // --- Cálculo de Fotos (40%) ---
  let photoScore = 0;
  const hasCover = files.some(f => f.name.startsWith('cover/'));
  const compcardFilesCount = files.filter(f => f.name.startsWith('compcard/')).length;
  const portfolioFilesCount = files.filter(f => f.name.startsWith('portfolio/')).length;

  if (hasCover) photoScore += 15; // Portada es 15%
  if (compcardFilesCount >= 3) photoScore += 15; // Contraportada (mín. 3 fotos) es 15%
  if (portfolioFilesCount >= 3) photoScore += 10; // Portafolio (mín. 3 fotos) es 10%

  score += Math.min(photoScore, PHOTOS_WEIGHT);

  return Math.round(score);
}

/**
 * Obtiene una lista de modelos, enriquecida con el porcentaje de completado del perfil.
 * Esta función está diseñada para ser llamada desde el servidor (ej. API Routes).
 */
export async function getModelsEnriched(params: {
    query?: string;
    country?: string;
    minHeight?: string;
    maxHeight?: string;
    sortKey?: keyof Model;
    sortDir?: 'asc' | 'desc';
    currentPage?: number;
}) {
    noStore();
    const supabase = createClient();
    const { query, country, minHeight, maxHeight, sortKey = 'alias', sortDir = 'asc', currentPage = 1 } = params;
    const ITEMS_PER_PAGE = 24;
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    let supabaseQuery = supabase.from('models').select('*', { count: 'exact' });

    if (query) supabaseQuery = supabaseQuery.or(`full_name.ilike.%${query}%,alias.ilike.%${query}%`);
    if (country) supabaseQuery = supabaseQuery.eq('country', country);
    if (minHeight) supabaseQuery = supabaseQuery.gte('height_cm', Number(minHeight));
    if (maxHeight) supabaseQuery = supabaseQuery.lte('height_cm', Number(maxHeight));

    const { data: models, error, count } = await supabaseQuery
        .order(sortKey, { ascending: sortDir === 'asc' })
        .range(from, to);

    if (error) {
        console.error("Error fetching models:", error);
        throw new Error('No se pudieron cargar los modelos.');
    }
    if (!models) return { data: [], count: 0 };

    const enrichedModels = await Promise.all(
        models.map(async (model) => {
            const { data: files } = await supabase.storage
                .from('models')
                .list(model.id, { limit: 100, recursive: true });

            const completion = calculateProfileCompletion(model, files || []);
            return { ...model, profile_completion: completion };
        })
    );

    return { data: enrichedModels, count: count || 0 };
}

// El resto de funciones se mantienen igual para otras partes de la app
export async function getModelById(id: string) {
  noStore();
  const supabase = createClient();
  const { data, error } = await supabase.from('models').select('*').eq('id', id).single();
  if (error) { console.error('Error fetching model by ID:', error); return null; }
  return data as Model;
}
