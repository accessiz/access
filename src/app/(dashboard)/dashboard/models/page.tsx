import { getModelsDirectoryPage, getBusyModelsToday, MODELS_DIRECTORY_PAGE_SIZE } from '@/lib/api/models';
import { getModelByIdCached, getModelWorkHistoryCached } from '@/lib/api/cached';
import { ModelsPageContent } from '@/components/models';
import ModelProfilePageClient from './[id]/page-client';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getExchangeRate } from '@/lib/actions/exchange-rates';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Modelos',
};

// Tipo para las props de la página
type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * Models Page (Server Component)
 * 
 * Two-column layout:
 * - LEFT: List of models with search
 * - RIGHT: Selected model's full profile
 * 
 * Uses ?selected=modelId to track which model's profile to show.
 */
export default async function ModelsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const selectedModelId = typeof resolvedSearchParams.selected === 'string' ? resolvedSearchParams.selected : undefined;
  const query = typeof resolvedSearchParams.q === 'string' ? resolvedSearchParams.q : undefined;
  const gender = resolvedSearchParams.gender === 'male' || resolvedSearchParams.gender === 'female'
    ? resolvedSearchParams.gender
    : 'all';
  const busy = resolvedSearchParams.busy === 'busy' ? 'busy' : 'all';
  const pageParam = typeof resolvedSearchParams.page === 'string' ? Number(resolvedSearchParams.page) : 1;
  const currentPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const selectedModelPromise = selectedModelId
    ? Promise.all([
      getModelByIdCached(selectedModelId),
      getModelWorkHistoryCached(selectedModelId),
    ])
    : Promise.resolve([null, []] as const);

  const [busyModelMap, rateResult, [selectedModel, workHistory]] = await Promise.all([
    getBusyModelsToday(),
    getExchangeRate(),
    selectedModelPromise,
  ]);

  const modelsResult = await getModelsDirectoryPage({
    query,
    gender,
    currentPage,
    limit: MODELS_DIRECTORY_PAGE_SIZE,
    busyModelIds: busy === 'busy' ? Array.from(busyModelMap.keys()) : undefined,
  });

  const models = modelsResult.data ?? [];
  const totalCount = modelsResult.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / MODELS_DIRECTORY_PAGE_SIZE));

  const currentRate = rateResult.success && rateResult.rate ? rateResult.rate : 7.70;

  return (
    <div className="flex flex-1 h-full min-h-0 flex-col gap-6">
      <header className="flex flex-col gap-x-4 gap-y-4 pb-4 border-b sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-display font-semibold">Talento</h1>
            <span aria-hidden className="h-5 w-px bg-border" />
            <p className="text-label text-muted-foreground whitespace-nowrap">{totalCount} talentos</p>
          </div>
        </div>

        <div className="flex items-center gap-x-3 gap-y-3">
          <Button asChild className="gap-x-2 gap-y-2">
            <Link href="/dashboard/models/new">
              <Plus className="h-4 w-4" />
              Añadir Talento
            </Link>
          </Button>
        </div>
      </header>

      <ModelsPageContent
        initialModels={models}
        busyModelMap={busyModelMap}
        currentPage={Math.min(currentPage, totalPages)}
        totalPages={totalPages}
        totalCount={totalCount}
        initialQuery={query ?? ''}
        initialGender={gender}
        initialBusy={busy}
      >
        {/* Right column: Full profile of selected model */}
        {selectedModel && (
          <ModelProfilePageClient
            key={selectedModel.id}
            initialModel={selectedModel}
            workHistory={workHistory}
            currentRate={currentRate}
          />
        )}
      </ModelsPageContent>
    </div>
  );
}