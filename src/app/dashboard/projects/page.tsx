import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProjectsForUser } from '@/lib/api/projects';
// CORRECCIÓN: El nombre del archivo a importar es './projects-client-page'
import ProjectsClientPage from './projects-client-page';
import { Project } from '@/lib/types';

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ProjectsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  
  const resolvedSearchParams = await searchParams;

  const { data, count } = await getProjectsForUser({
    query: resolvedSearchParams.q as string,
    year: resolvedSearchParams.year as string,
    month: resolvedSearchParams.month as string,
    currentPage: Number(resolvedSearchParams.page) || 1,
    sortKey: (resolvedSearchParams.sort as keyof Project) || 'created_at',
    sortDir: (resolvedSearchParams.dir as 'asc' | 'desc') || 'desc',
  });

  // CORRECCIÓN: El componente que se usa es <ProjectsClientPage>
  return <ProjectsClientPage initialProjects={data} initialCount={count} />;
}