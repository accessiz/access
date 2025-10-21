import { createClient } from '@/lib/supabase/server';
import ModelsClientPage from './models-client-page';
import { Model } from '@/lib/types';
import { logError } from '@/lib/utils/errors';
import { SUPABASE_PUBLIC_URL } from '@/lib/constants';

// Definimos el tipo que el componente cliente espera para los datos iniciales
type InitialData = {
  models: Model[];
  count: number;
  countries: string[];
  publicUrl: string;
};

export default async function ModelsPage() {
  const supabase = await createClient();
  
  // --- CORRECCIÓN PRINCIPAL ---
  // Se ha modificado la consulta para:
  // 1. Usar 'height_cm' en lugar del antiguo 'height_m'.
  // 2. Seleccionar todas las columnas necesarias para la vista de tabla ('country', 'instagram', etc.).
  // 3. Añadir un límite inicial para que la carga de la primera página sea rápida.
  const { data: models, error, count } = await supabase
    .from('models')
    .select('id, alias, full_name, status, gender, height_cm, country, instagram, tiktok, profile_completeness', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(24); // Límite inicial, coincide con PAGE_SIZE en el cliente

  if (error) {
    logError(error, { action: 'modelsPage.fetch models' });
  }
  
  // --- MEJORAS ADICIONALES ---
  // Obtenemos la URL pública del bucket de Supabase para construir las rutas de las imágenes.
  const publicUrl = SUPABASE_PUBLIC_URL;

  // Obtenemos la lista única de países directamente desde la base de datos para los filtros.
  const { data: countriesData, error: countriesError } = await supabase
    .from('models')
    .select('country')
    .neq('country', null);

  if (countriesError) {
    logError(countriesError, { action: 'modelsPage.fetch countries' });
  }

  // Creamos una lista de países únicos sin repetidos ni nulos.
  const countries = countriesData ? [...new Set(countriesData.map(c => c.country).filter(Boolean))] : [];
  
  // Construimos el objeto 'initialData' que el componente cliente espera.
  const initialData: InitialData = {
    models: (models as Model[]) ?? [],
    count: count ?? 0,
    countries: countries as string[],
  publicUrl: publicUrl,
  };

  // Pasamos el objeto 'initialData' completo al componente cliente.
  return <ModelsClientPage initialData={initialData} />;
}