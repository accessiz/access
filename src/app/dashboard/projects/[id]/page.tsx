import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProjectById, getModelsForProject } from '@/lib/api/projects';
import { getModelsEnriched } from '@/lib/api/models'; 
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

  return (
    <ProjectDetailClient
      project={project}
      initialSelectedModels={selectedModels}
      allModels={allModels ?? []}
    />
  );
}
