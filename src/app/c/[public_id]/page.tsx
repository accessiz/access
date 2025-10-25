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
  const publicId = resolvedParams.public_id; // Renombrado para claridad

  // 1. Obtenemos el proyecto usando el publicId (esto funciona)
  const project = await getProjectById(publicId);

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

  // 2. Comprobación de estado (sin cambios)
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
 
  // --- Lógica que solo se ejecuta para proyectos ACTIVOS ---
 
  const cookieStore = await cookies();
  // --- CORRECCIÓN DE COOKIE ---
  // Usamos el ID real (UUID) para la cookie, ya que 'publicId' podría no ser único si lo cambias.
  // 'verifyProjectPassword' también usa el ID real.
  const cookieName = `project_access_${project.id}`;
  const hasAccessCookie = cookieStore.get(cookieName)?.value === 'true';

  // --- CORRECCIÓN CLAVE ---
  // Ahora usamos 'project.id' (el UUID real) para llamar a getModelsForProject,
  // en lugar de 'publicId' (el ID corto de la URL).
  const models = (!project.password || hasAccessCookie) ? await getModelsForProject(project.id) : [];

  return (
    <ClientViewHandler
      project={project}
      initialModels={models}
      hasAccessCookie={hasAccessCookie}
    />
  );
}