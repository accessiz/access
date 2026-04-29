import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getModelByIdCached, getModelWorkHistoryCached } from '@/lib/api/cached';
import ModelProfilePageClient from './page-client';
import { getExchangeRate } from '@/lib/actions/exchange-rates';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Perfil de Modelo',
};

// Forzamos el renderizado dinámico para evitar problemas con params
type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ModelProfilePage({ params }: PageProps) {
  // ✅ params ahora es una Promise, así que lo resolvemos antes de usarlo
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!user || error) {
    redirect('/login');
  }

  const [model, workHistory, rateResult] = await Promise.all([
    getModelByIdCached(id),
    getModelWorkHistoryCached(id),
    getExchangeRate(),
  ]);
  const currentRate = rateResult.success && rateResult.rate ? rateResult.rate : 7.70;

  if (!model) {
    return <div>Modelo no encontrado</div>;
  }

  // Model ahora viene enriquecido con coverUrl, compCardUrls y galleryUrls
  return <ModelProfilePageClient initialModel={model} workHistory={workHistory} currentRate={currentRate} />;
}