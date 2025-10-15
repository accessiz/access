import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProjectById, getModelsForProject } from '@/lib/api/projects';
import { getModelsEnriched } from '@/lib/api/models';
import ProjectDetailClient from './project-detail-client';

// Forzamos el renderizado dinámico para esta página
export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectDetailPage({ params }: PageProps) {
  // Resolvemos la promesa para obtener el ID
  const { id } = await params;

  // Autenticación de usuario
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Obtenemos todos los datos necesarios en paralelo para optimizar la carga
  const [project, selectedModels, { data: allModels }] = await Promise.all([
    getProjectById(id),
    getModelsForProject(id),
    getModelsEnriched({ limit: 1000 }) // Obtenemos todos los modelos para la selección
  ]);

  if (!project) {
    return (
      <div className="p-8 md:p-12 text-center">
        <h1 className="text-2xl font-bold">Proyecto no encontrado</h1>
        <p className="text-muted-foreground">El proyecto que buscas no existe o no tienes permiso para verlo.</p>
      </div>
    );
  }

  // Pasamos los datos al componente de cliente para que se encargue de la interactividad
  return (
    <ProjectDetailClient 
      project={project} 
      initialSelectedModels={selectedModels}
      allModels={allModels}
    />
  );
}

