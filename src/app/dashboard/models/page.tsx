import { createClient } from '@/lib/supabase/server';
import ModelsClientPage from './models-client-page';
import { Model } from '@/lib/types';
import { logError } from '@/lib/utils/errors';
import { SUPABASE_PUBLIC_URL } from '@/lib/constants';
import { getModelsEnriched } from '@/lib/api/models';

// CORRECCIÓN 1: Envolver el tipo de searchParams en una Promise
type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// Definimos el tipo que el componente cliente espera para los datos
type InitialData = {
  models: Model[];
  count: number;
  countries: string[];
  publicUrl: string;
};

// La página ahora es ASYNC y recibe searchParams
export default async function ModelsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  
  // CORRECCIÓN 2: Usar 'await' para resolver la promesa de searchParams
  const resolvedSearchParams = await searchParams;

  // 1. Procesar searchParams (usando la variable resuelta)
  const params = {
    query: resolvedSearchParams.q as string | undefined,
    country: resolvedSearchParams.country as string | undefined,
    minHeight: resolvedSearchParams.minHeight as string | undefined,
    maxHeight: resolvedSearchParams.maxHeight as string | undefined,
    sortKey: (resolvedSearchParams.sort as keyof Model) || 'alias',
    sortDir: (resolvedSearchParams.dir as 'asc' | 'desc') || 'asc',
    currentPage: Number(resolvedSearchParams.page) || 1,
  };

  // 2. Llamar a la función de fetching del servidor con los params
  const { data: models, count } = await getModelsEnriched(params);

  // 3. Obtenemos la URL pública (como antes)
  const publicUrl = SUPABASE_PUBLIC_URL;

  // 4. Obtenemos los países para los filtros (como antes)
  const { data: countriesData, error: countriesError } = await supabase
    .from('models')
    .select('country')
    .neq('country', null);

  if (countriesError) {
    logError(countriesError, { action: 'modelsPage.fetch countries' });
  }

  const countries = countriesData ? [...new Set(countriesData.map(c => c.country).filter(Boolean))] : [];
  
  // 5. Construimos el objeto 'initialData' con los datos YA filtrados
  const initialData: InitialData = {
    models: (models as Model[]) ?? [], // models ya viene enriquecido con coverUrl
    count: count ?? 0,
    countries: countries as string[],
    publicUrl: publicUrl,
  };

  // 6. Pasamos los datos al componente cliente
  return <ModelsClientPage initialData={initialData} />;
}