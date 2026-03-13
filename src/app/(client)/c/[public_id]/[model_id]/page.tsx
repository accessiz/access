import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { getModelForProject } from '@/lib/api/projects';
import PortfolioView from './_components/PortfolioView';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Project } from '@/lib/types';
import PasswordProtect from '../_components/PasswordProtect';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ public_id: string; model_id: string }>;
};

export default async function ModelPortfolioPage({ params }: PageProps) {
  const { public_id: projectPublicId, model_id: modelId } = await params;

  // 1. Obtener el proyecto usando supabaseAdmin para saltar RLS en vista pública
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectPublicId);

  let projectQuery = supabaseAdmin
    .from('projects')
    .select('*, project_schedule(*)');

  if (isUUID) {
    projectQuery = projectQuery.or(`id.eq.${projectPublicId},public_id.eq.${projectPublicId}`);
  } else {
    projectQuery = projectQuery.eq('public_id', projectPublicId);
  }

  const { data: projectData, error: projectError } = await projectQuery.maybeSingle();

  if (!projectData || projectError) {
    notFound();
  }

  const project = projectData as unknown as Project;

  // --- 🔒 SEGURIDAD: Protección por Contraseña ---
  const cookieStore = await cookies();
  const cookieName = `project_access_${project.id}`;
  const rawCookieValue = cookieStore.get(cookieName)?.value;

  let hasAccess = false;
  if (rawCookieValue) {
    try {
      const { verifyCookie, getCookieSecret } = await import('@/lib/utils/cookie-signature');
      hasAccess = verifyCookie(rawCookieValue, getCookieSecret());
    } catch (e) {
      console.error('[ModelPortfolioPage] Cookie verification failed:', e);
    }
  }

  // Si tiene password y no tiene acceso, mostrar pantalla de bloqueo
  if (project.password && !hasAccess) {
    return <PasswordProtect projectId={project.id} projectName={project.project_name || 'este proyecto'} />;
  }
  // ---------------------------------------------

  // 2. Obtener el detalle del modelo para este proyecto
  const model = await getModelForProject(project.id, modelId);

  if (!model) {
    notFound();
  }

  // 3. Renderizar vista de portafolio
  return <PortfolioView project={project} model={model} />;
}