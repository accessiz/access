import { cookies } from 'next/headers';
import { getProjectById, getModelsForProject } from '@/lib/api/projects';
import ClientViewHandler from './_components/ClientViewHandler';
import { CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ public_id: string }>;
};

export default async function ClientViewPage({ params }: PageProps) {
  const resolvedParams = await params;
  const projectId = resolvedParams.public_id;

  const project = await getProjectById(projectId);

  if (!project) {
    return (
      <div className="flex h-screen w-full items-center justify-center text-center p-4">
        <div>
          <h1 className="text-4xl font-bold">Proyecto no encontrado</h1>
          <p className="text-muted-foreground mt-2">El enlace puede ser incorrecto o el proyecto ha sido eliminado.</p>
        </div>
      </div>
    );
  }

  // ✅ NUEVO: Si el proyecto ya fue completado o archivado, mostramos una pantalla final.
  if (project.status === 'completed' || project.status === 'archived') {
    return (
      <div className="flex h-screen w-full items-center justify-center text-center p-4 bg-white">
        <div>
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <h1 className="text-3xl font-bold">¡Gracias!</h1>
          <p className="text-muted-foreground mt-2 max-w-md">
            La selección para este proyecto ya ha sido completada y enviada.
            Para cualquier consulta, por favor comunícate a <a href="mailto:info@izmanagementglobal.com" className="font-semibold text-primary underline">info@izmanagementglobal.com</a>.
          </p>
        </div>
      </div>
    );
  }

  const cookieStore = await cookies();
  const cookieName = `project_access_${projectId}`;
  const hasAccessCookie = cookieStore.get(cookieName)?.value === 'true';

  const models = (!project.password || hasAccessCookie) ? await getModelsForProject(projectId) : [];

  return (
    <ClientViewHandler
      project={project}
      initialModels={models}
      hasAccessCookie={hasAccessCookie}
    />
  );
}