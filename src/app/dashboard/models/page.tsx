import { getModelsEnriched, getBusyModelsToday, getModelById, getModelWorkHistory } from '@/lib/api/models';
import { ModelsPageContent } from '@/components/models';
import { Model } from '@/lib/types';
import ModelProfilePageClient from './[id]/page-client';

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

  // Get selected model ID from URL params
  const selectedModelId = resolvedSearchParams.selected as string | undefined;

  // Fetch params for models list
  const params = {
    query: resolvedSearchParams.q as string | undefined,
    country: resolvedSearchParams.country as string | undefined,
    minHeight: resolvedSearchParams.minHeight as string | undefined,
    maxHeight: resolvedSearchParams.maxHeight as string | undefined,
    sortKey: (resolvedSearchParams.sort as keyof Model) || 'alias',
    sortDir: (resolvedSearchParams.dir as 'asc' | 'desc') || 'asc',
    currentPage: 1,
    limit: 500,
  };

  // Fetch models list and busy status in parallel
  const [modelsResult, busyModelIds] = await Promise.all([
    getModelsEnriched(params),
    getBusyModelsToday(),
  ]);

  const models = (modelsResult.data as Model[]) ?? [];

  // If a model is selected, fetch its full data for the right column
  let selectedModel = null;
  let workHistory: Awaited<ReturnType<typeof getModelWorkHistory>> = [];

  if (selectedModelId) {
    [selectedModel, workHistory] = await Promise.all([
      getModelById(selectedModelId),
      getModelWorkHistory(selectedModelId),
    ]);
  }

  return (
    <ModelsPageContent
      initialModels={models}
      busyModelIds={busyModelIds}
    >
      {/* Right column: Full profile of selected model */}
      {selectedModel && (
        <ModelProfilePageClient
          key={selectedModel.id}
          initialModel={selectedModel}
          workHistory={workHistory}
        />
      )}
    </ModelsPageContent>
  );
}