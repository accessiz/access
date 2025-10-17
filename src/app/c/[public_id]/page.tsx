import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getProjectById, getModelsForProject } from '@/lib/api/projects';

import PasswordProtect from './_components/PasswordProtect';
// Futuro componente del slider:
// import ClientSlider from './_components/ClientSlider';

export const dynamic = 'force-dynamic';

type PageProps = {
  // ✅ params también es una Promise
  params: Promise<{ public_id: string }>;
};

// ✅ La página sigue siendo async
export default async function ClientViewPage({ params }: PageProps) {
  // ✅ Resolvemos params primero
  const resolvedParams = await params;
  const projectId = resolvedParams.public_id;

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

  // 1. Si el proyecto NO tiene contraseña, mostramos el contenido.
  if (!project.password) {
    // const models = await getModelsForProject(projectId);
    // return <ClientSlider project={project} models={models} />;
    return <div className="p-8">Contenido del proyecto público (El slider irá aquí).</div>;
  }

  // 2. Si TIENE contraseña, revisamos la cookie de acceso.
  const cookieName = `project_access_${projectId}`;
  
  // ✅ INICIO DE LA CORRECCIÓN: Usamos 'await' para resolver cookies()
  const cookieStore = await cookies(); 
  const hasAccess = cookieStore.get(cookieName)?.value === 'true';
  // ✅ FIN DE LA CORRECCIÓN

  if (hasAccess) {
    // const models = await getModelsForProject(projectId);
    // return <ClientSlider project={project} models={models} />;
    return <div className="p-8">Contenido del proyecto PROTEGIDO (El slider irá aquí).</div>;
  }

  // 3. Si tiene contraseña Y NO hay cookie, mostramos el formulario.
  return <PasswordProtect projectId={projectId} projectName={project.project_name || 'este proyecto'} />;
}