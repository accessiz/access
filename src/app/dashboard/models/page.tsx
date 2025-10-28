import { createClient } from '@/lib/supabase/server';
import ModelsClientPage from './models-client-page';
import { Model } from '@/lib/types';
import { logError } from '@/lib/utils/errors';
// Eliminamos la importación de SUPABASE_PUBLIC_URL ya que no se usa aquí
// import { SUPABASE_PUBLIC_URL } from '@/lib/constants';
import { getModelsEnriched } from '@/lib/api/models';

// Tipo para las props de la página (searchParams es una Promise)
type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// Tipo para los datos iniciales que se pasan al componente cliente
// Quitamos 'publicUrl' ya que ModelsClientPage no lo necesita
type InitialData = {
  models: Model[];
  count: number;
  countries: string[];
};

// La página ahora es ASYNC para manejar la Promise de searchParams
export default async function ModelsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  
  // Resolvemos la Promise para obtener los parámetros de búsqueda
  const resolvedSearchParams = await searchParams;

  // Procesamos los parámetros de búsqueda
  const params = {
    query: resolvedSearchParams.q as string | undefined,
    country: resolvedSearchParams.country as string | undefined,
    minHeight: resolvedSearchParams.minHeight as string | undefined,
    maxHeight: resolvedSearchParams.maxHeight as string | undefined,
    sortKey: (resolvedSearchParams.sort as keyof Model) || 'alias',
    sortDir: (resolvedSearchParams.dir as 'asc' | 'desc') || 'asc',
    currentPage: Number(resolvedSearchParams.page) || 1,
  };

  // Obtenemos los modelos filtrados y enriquecidos del servidor
  const { data: models, count } = await getModelsEnriched(params);

  // Obtenemos la lista de países para los filtros
  const { data: countriesData, error: countriesError } = await supabase
    .from('models')
    .select('country')
    .neq('country', null) // Asegura que solo traiga filas donde 'country' no es null
    .not('country', 'eq', ''); // Asegura que solo traiga filas donde 'country' no es un string vacío

  if (countriesError) {
    logError(countriesError, { action: 'modelsPage.fetch countries' });
  }

  // --- CORRECCIÓN APLICADA ---
  // 1. Mapea los resultados (manejando posible null/undefined en countriesData)
  // 2. Filtra valores nulos o vacíos que puedan venir de la DB
  // 3. Crea un Set para obtener valores únicos
  // 4. Convierte el Set a un Array usando Array.from()
  const uniqueCountriesSet = new Set(
    (countriesData || []) // Maneja el caso de que countriesData sea null/undefined
      .map(c => c.country) // Extrae el valor de 'country'
      .filter((c): c is string => Boolean(c)) // Filtra null, undefined, y strings vacíos, y asegura tipo string
  );
  const countries = Array.from(uniqueCountriesSet).sort(); // Convertimos a Array y ordenamos alfabéticamente
  // --- FIN DE LA CORRECCIÓN ---
  
  // Construimos el objeto de datos iniciales para el cliente
  const initialData: InitialData = {
    models: (models as Model[]) ?? [], // Aseguramos que 'models' sea un array
    count: count ?? 0, // Aseguramos que 'count' sea un número
    countries: countries, // Pasamos el array de países únicos y ordenados
  };

  // Renderizamos el componente cliente con los datos iniciales
  return <ModelsClientPage initialData={initialData} />;
}