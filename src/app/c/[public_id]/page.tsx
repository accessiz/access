import { cookies } from 'next/headers';
import { getProjectById, getModelsForProject } from '@/lib/api/projects';
import ClientViewHandler from './_components/ClientViewHandler'; // Importamos el nuevo componente

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ public_id: string }>;
};

export default async function ClientViewPage({ params }: PageProps) {
  const resolvedParams = await params;
  const projectId = resolvedParams.public_id;

  // 1. Obtenemos el proyecto
  const project = await getProjectById(projectId);

  if (!project) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
        <div className="text-center">
            <h1 className="text-4xl font-bold">Proyecto no encontrado</h1>
            <p className="text-muted-foreground mt-2">El enlace puede ser incorrecto o el proyecto ha sido eliminado.</p>
        </div>
      </div>
    );
  }

  // 2. Verificamos el acceso por cookie
  const cookieStore = await cookies();
  const cookieName = `project_access_${projectId}`;
  const hasAccessCookie = cookieStore.get(cookieName)?.value === 'true';

  // 3. Obtenemos los modelos SOLO si el acceso está garantizado (sin contraseña o con cookie)
  const models = (!project.password || hasAccessCookie)
    ? await getModelsForProject(projectId)
    : [];

  // 4. Pasamos toda la data al componente de cliente para que él decida qué hacer
  return (
    <ClientViewHandler
      project={project}
      initialModels={models}
      hasAccessCookie={hasAccessCookie}
    />
  );
}