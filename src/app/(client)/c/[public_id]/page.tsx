import { cookies } from 'next/headers';
import { getProjectById, getModelsForProject } from '@/lib/api/projects';
import { createClient } from '@/lib/supabase/server';
import ClientViewHandler from './_components/ClientViewHandler';
import ClientSummaryView from './_components/ClientSummaryView';
import PasswordProtect from './_components/PasswordProtect';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ public_id: string }>;
};

export default async function ClientViewPage({ params }: PageProps) {
  const { public_id: publicId } = await params;

  // Verificar si es un admin (usuario logueado) — sin bloquear el render
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = !!user;

  const project = await getProjectById(publicId);

  // 1. Manejo de Proyecto No Encontrado
  if (!project) {
    return (
      <div className="flex h-screen w-full items-center justify-center text-center p-4 bg-background text-foreground">
        <div>
          <h1 className="text-display mb-2">Proyecto no encontrado</h1>
          <p className="text-body text-muted-foreground">
            El enlace puede ser incorrecto o el proyecto ha sido eliminado.
          </p>
        </div>
      </div>
    );
  }

  // --- 🔒 LÓGICA DE SEGURIDAD UNIFICADA ---
  // Verificamos el acceso ANTES de decidir qué vista mostrar.
  const cookieStore = await cookies();
  const cookieName = `project_access_${project.id}`;
  const rawCookieValue = cookieStore.get(cookieName)?.value;

  // Validate HMAC-signed cookie (set by verifyProjectPassword action)
  let hasAccessCookie = false;
  if (rawCookieValue) {
    const { verifyCookie, getCookieSecret } = await import('@/lib/utils/cookie-signature');
    hasAccessCookie = verifyCookie(rawCookieValue, getCookieSecret());
  }

  // Si el proyecto tiene contraseña Y el usuario no tiene la cookie de acceso:
  if (project.password && !hasAccessCookie) {
    // Mostramos la pantalla de contraseña inmediatamente, protegiendo todo lo demás.
    return <PasswordProtect projectId={project.id} projectName={project.project_name || 'este proyecto'} />;
  }
  // ----------------------------------------

  // 2. Lógica para proyectos FINALIZADOS (Mostrar Resumen)
  // Si llegamos aquí, es porque es público o ya ingresó la contraseña.
  if (project.status === 'completed' || project.status === 'archived') {
    const models = await getModelsForProject(project.id);
    return (
      <ClientSummaryView project={project} models={models} />
    );
  }
  
  // 3. Lógica para proyectos ACTIVOS (Mostrar Herramienta de Selección)
  // Ya verificamos el permiso arriba, así que podemos cargar los datos con seguridad.
  const models = await getModelsForProject(project.id);

  return (
    <ClientViewHandler
      project={project}
      initialModels={models}
      hasAccessCookie={hasAccessCookie}
      isAdmin={isAdmin}
    />
  );
}
