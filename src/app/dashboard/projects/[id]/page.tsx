import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProjectById, getModelsForProject } from '@/lib/api/projects';
import { getModelsEnriched } from '@/lib/api/models';
import { syncProjectSchedule } from '@/lib/actions/projects';
import ProjectDetailClient from './project-detail-client';


export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const [project, selectedModels, { data: allModels }] = await Promise.all([
    getProjectById(id),
    getModelsForProject(id),
    getModelsEnriched({ limit: 1000 })
  ]);

  if (!project) {
    return (
      <div className="p-8 md:p-12 text-center">
        <h1 className="text-heading-24">Proyecto no encontrado</h1>
        <p className="text-muted-foreground">El proyecto que buscas no existe o no tienes permiso para verlo.</p>
      </div>
    );
  }

  // Auto-sync if using old data format
  if ((!project.project_schedule || project.project_schedule.length === 0) && project.schedule && (project.schedule as any[]).length > 0) {
    await syncProjectSchedule(id);
    // Re-fetch to get IDs
    const updatedProject = await getProjectById(id);
    if (updatedProject) {
      return (
        <ProjectDetailClient
          project={updatedProject}
          initialSelectedModels={selectedModels}
          allModels={allModels ?? []}
        />
      );
    }
  }

  return (
    <ProjectDetailClient
      project={project}
      initialSelectedModels={selectedModels}
      allModels={allModels ?? []}
    />
  );
}
