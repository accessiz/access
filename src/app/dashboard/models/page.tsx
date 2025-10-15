import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getModelsEnriched } from '@/lib/api/models';
import { Model } from '@/lib/types';
import ModelsClientPage from './models-client-page';

export const dynamic = 'force-dynamic';

// Tipado para los datos iniciales
type InitialData = {
  models: Model[];
  count: number;
  countries: string[];
  publicUrl: string;
};

export default async function ModelsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // ✅ Resolvemos searchParams antes de usarlos
  const resolvedParams = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 1. Obtener los datos iniciales en el servidor
  const params = {
    query: resolvedParams.q as string || undefined,
    country: resolvedParams.country as string || undefined,
    minHeight: resolvedParams.minHeight as string || undefined,
    maxHeight: resolvedParams.maxHeight as string || undefined,
    sortKey: (resolvedParams.sort as keyof Model) || 'alias',
    sortDir: (resolvedParams.dir as 'asc' | 'desc') || 'asc',
    currentPage: Number(resolvedParams.page) || 1,
    limit: 24, // Coincide con PAGE_SIZE del cliente
  };

  const { data: models, count } = await getModelsEnriched(params);

  // Obtener países distintos
  const { data: countryData } = await supabase
    .from('models')
    .select('country')
    .neq('country', null);

  const distinctCountries = [...new Set(countryData?.map(item => item.country) || [])];

  // Obtener URL pública del storage
  const { data: urlData } = supabase.storage
    .from('Book_Completo_iZ_Management')
    .getPublicUrl('');

  const initialData: InitialData = {
    models,
    count: count || 0,
    countries: distinctCountries,
    publicUrl: urlData.publicUrl,
  };

  // 2. Pasar los datos iniciales al componente cliente
  return <ModelsClientPage initialData={initialData} />;
}
