import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProjectByIdCached, getModelsForProjectCached } from '@/lib/api/cached';
import { MODEL_PICKER_PAGE_SIZE, getModelPickerPage } from '@/lib/api/models';
import { syncProjectSchedule } from '@/lib/actions/projects';
import ProjectDetailClient from './project-detail-client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Detalle de Proyecto',
};

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ProjectDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const pickerQuery = typeof resolvedSearchParams.talentQ === 'string' ? resolvedSearchParams.talentQ : undefined;
  const pickerPageParam = typeof resolvedSearchParams.talentPage === 'string' ? Number(resolvedSearchParams.talentPage) : 1;
  const pickerCurrentPage = Number.isFinite(pickerPageParam) && pickerPageParam > 0 ? pickerPageParam : 1;

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const [project, selectedModels] = await Promise.all([
    getProjectByIdCached(id),
    getModelsForProjectCached(id),
  ]);

  const pickerResult = await getModelPickerPage({
    query: pickerQuery,
    currentPage: pickerCurrentPage,
    limit: MODEL_PICKER_PAGE_SIZE,
    excludeIds: selectedModels.map((model) => model.id),
  });

  const availableModels = pickerResult.data ?? [];
  const availableModelsCount = pickerResult.count ?? 0;
  const availableModelsTotalPages = Math.max(1, Math.ceil(availableModelsCount / MODEL_PICKER_PAGE_SIZE));

  if (!project) {
    return (
      <div className="text-center">
        <h1 className="text-display">Proyecto no encontrado</h1>
        <p className="text-muted-foreground">El proyecto que buscas no existe o no tienes permiso para verlo.</p>
      </div>
    );
  }

  // Auto-sync if using old data format
  if ((!project.project_schedule || project.project_schedule.length === 0) && project.schedule && Array.isArray(project.schedule) && project.schedule.length > 0) {
    await syncProjectSchedule(id);
    // Re-fetch to get IDs
    const updatedProject = await getProjectByIdCached(id);
    if (updatedProject) {
      return (
        <ProjectDetailClient
          project={updatedProject}
          initialSelectedModels={selectedModels}
          availableModels={availableModels}
          availableModelsCount={availableModelsCount}
          availableModelsCurrentPage={Math.min(pickerCurrentPage, availableModelsTotalPages)}
          availableModelsTotalPages={availableModelsTotalPages}
          initialTalentQuery={pickerQuery ?? ''}
        />
      );
    }
  }

  return (
    <ProjectDetailClient
      project={project}
      initialSelectedModels={selectedModels}
      availableModels={availableModels}
      availableModelsCount={availableModelsCount}
      availableModelsCurrentPage={Math.min(pickerCurrentPage, availableModelsTotalPages)}
      availableModelsTotalPages={availableModelsTotalPages}
      initialTalentQuery={pickerQuery ?? ''}
    />
  );
}
