import { createClient } from '@/lib/supabase/server';
import { unstable_noStore as noStore } from 'next/cache';
import { Model } from '@/lib/types';

interface GetModelsParams {
  query?: string;
  country?: string;
  minHeight?: string;
  maxHeight?: string;
}

// ... (La función calculateProfileCompletion se mantiene igual)
function calculateProfileCompletion(model: Model, files: { name: string }[]): number {
  let score = 0;
  const dataWeight = 60;
  const photosWeight = 40;

  const essentialDataFields: (keyof Model)[] = [
    'alias', 'full_name', 'birth_date', 'country', 'height_cm', 
    'shoulders_cm', 'bust_cm', 'waist_cm', 'hips_cm', 'top_size', 
    'pants_size', 'shoe_size_eu', 'instagram'
  ];
  const filledDataFields = essentialDataFields.filter(field => model[field] != null && model[field] !== '').length;
  score += (filledDataFields / essentialDataFields.length) * dataWeight;

  let photoScore = 0;
  const hasCover = files.some(f => f.name.startsWith('cover.'));
  const compcardFiles = files.filter(f => f.name.startsWith('compcard/')).length;
  const portfolioFiles = files.filter(f => f.name.startsWith('portfolio/')).length;

  if (hasCover) photoScore += 15;
  if (compcardFiles >= 3) photoScore += 15;
  if (portfolioFiles >= 2) photoScore += 10;

  score += Math.min(photoScore, photosWeight);

  return Math.round(score);
}

// ... (La función getModels se mantiene igual)
export async function getModels({ query, country, minHeight, maxHeight }: GetModelsParams) {
  noStore();
  const supabase = createClient();

  let supabaseQuery = supabase.from('models').select('*', { count: 'exact' });
  if (query) supabaseQuery = supabaseQuery.ilike('alias', `%${query}%`);
  if (country) supabaseQuery = supabaseQuery.eq('country', country);
  if (minHeight) supabaseQuery = supabaseQuery.gte('height_cm', Number(minHeight));
  if (maxHeight) supabaseQuery = supabaseQuery.lte('height_cm', Number(maxHeight));
  const { data: models, error, count } = await supabaseQuery.order('alias', { ascending: true });

  if (error) throw new Error('No se pudieron cargar los modelos.');
  if (!models) return { data: [], count: 0 };

  const enrichedModels = await Promise.all(
    models.map(async (model) => {
      const { data: files, error: filesError } = await supabase.storage
        .from('models')
        .list(model.id, { limit: 100, recursive: true });

      const completion = calculateProfileCompletion(model, files || []);
      return { ...model, profile_completion: completion };
    })
  );

  return { data: enrichedModels, count };
}

// --- NUEVA FUNCIÓN ---
/**
 * Obtiene los datos de un único modelo por su ID.
 * @param id - El ID del modelo a buscar.
 * @returns El objeto del modelo o null si no se encuentra.
 */
export async function getModelById(id: string) {
  noStore();
  const supabase = createClient();
  const { data, error } = await supabase
    .from('models')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching model by ID:', error);
    return null;
  }

  return data as Model;
}

// ... (La función getUniqueCountries se mantiene igual)
export async function getUniqueCountries() {
    noStore();
    const supabase = createClient();
    const { data, error } = await supabase.from('models').select('country').neq('country', null).order('country', { ascending: true });
    if (error) {
        console.error('Error fetching countries:', error);
        return [];
    }
    return [...new Set(data?.map(item => item.country) || [])];
}
