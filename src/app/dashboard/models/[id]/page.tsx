import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getModelById } from '@/lib/api/models';
import ModelProfilePageClient from './page-client';
import { getExchangeRate } from '@/lib/actions/exchange-rates';

// Forzamos el renderizado dinámico para evitar problemas con params
export const dynamic = 'force-dynamic';

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

  const model = await getModelById(id);
  const workHistory = await import('@/lib/api/models').then(m => m.getModelWorkHistory(id));
  const rateResult = await getExchangeRate();
  const currentRate = rateResult.success && rateResult.rate ? rateResult.rate : 7.70;

  if (!model) {
    return <div>Modelo no encontrado</div>;
  }

  // Model ahora viene enriquecido con coverUrl, portfolioUrl y compCardUrls
  return <ModelProfilePageClient initialModel={model} workHistory={workHistory} currentRate={currentRate} />;
}