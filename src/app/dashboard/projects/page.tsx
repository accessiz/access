import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProjectsForUser } from '@/lib/api/projects';
import ProjectsClientPage from './projects-client-page';
import { Project } from '@/lib/types';

type PageProps = {
  // ✅ La prop searchParams ahora es una Promise
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// ✅ Convertimos la página en una función async
export default async function ProjectsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  
  // ✅ Resolvemos la promesa ANTES de usar sus valores
  const resolvedSearchParams = await searchParams;

  // Pasamos los parámetros de la URL ya resueltos a nuestra función
  const { data, count } = await getProjectsForUser({
    query: resolvedSearchParams.q as string,
    year: resolvedSearchParams.year as string,
    month: resolvedSearchParams.month as string,
    currentPage: Number(resolvedSearchParams.page) || 1,
    sortKey: (resolvedSearchParams.sort as keyof Project) || 'created_at',
    sortDir: (resolvedSearchParams.dir as 'asc' | 'desc') || 'desc',
  });

  return <ProjectsClientPage initialProjects={data} initialCount={count} />;
}

