import { cookies } from 'next/headers';
import { getProjectById, getModelsForProject } from '@/lib/api/projects';
import ClientViewHandler from './_components/ClientViewHandler';
import ClientSummaryView from './_components/ClientSummaryView';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ public_id: string }>;
};

export default async function ClientViewPage({ params }: PageProps) {
  const { public_id: publicId } = await params;
  const project = await getProjectById(publicId);

  // 1. Manejo de Proyecto No Encontrado
  if (!project) {
    return (
      <div className="flex h-screen w-full items-center justify-center text-center p-4 bg-background text-foreground">
        <div>
          <h1 className="text-4xl font-bold mb-2">Proyecto no encontrado</h1>
          <p className="text-muted-foreground">
            El enlace puede ser incorrecto o el proyecto ha sido eliminado.
          </p>
        </div>
      </div>
    );
  }

  // 2. Lógica para proyectos FINALIZADOS (Mostrar Resumen)
  if (project.status === 'completed' || project.status === 'archived') {
    // Obtenemos los modelos para mostrar el resumen de seleccionados/descartados
    const models = await getModelsForProject(project.id);
    
    return (
      <ClientSummaryView project={project} models={models} />
    );
  }
  
  // 3. Lógica para proyectos ACTIVOS (Mostrar Herramienta de Selección)
  const cookieStore = await cookies();
  const cookieName = `project_access_${project.id}`;
  const hasAccessCookie = cookieStore.get(cookieName)?.value === 'true';

  // Solo cargamos los modelos si es público o si ya tiene permiso (ahorramos recursos)
  const models = (!project.password || hasAccessCookie) ? await getModelsForProject(project.id) : [];

  return (
    <ClientViewHandler
      project={project}
      initialModels={models}
      hasAccessCookie={hasAccessCookie}
    />
  );
}