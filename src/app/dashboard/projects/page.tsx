import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProjectYearsForUser, getProjectsForUser } from '@/lib/api/projects';
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

  const [{ data, count }, availableYears] = await Promise.all([
    getProjectsForUser({
      query: resolvedSearchParams.q as string,
      year: resolvedSearchParams.year as string,
      month: resolvedSearchParams.month as string,
      status: resolvedSearchParams.status as string,
      currentPage: Number(resolvedSearchParams.page) || 1,
      sortKey: (resolvedSearchParams.sort as keyof Project) || 'created_at',
      sortDir: (resolvedSearchParams.dir as 'asc' | 'desc') || 'desc',
    }),
    getProjectYearsForUser(),
  ]);

  return (
    <ProjectsClientPage
      initialProjects={data as Project[]}
      initialCount={count ?? 0}
      availableYears={availableYears}
    />
  );
}
