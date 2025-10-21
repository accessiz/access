import { NextResponse, type NextRequest } from 'next/server';
import { getProjectsForUser } from '@/lib/api/projects';
import { logError } from '@/lib/utils/errors';
import { Project } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Extraemos todos los parámetros de la URL para pasarlos a nuestra función
    const params = {
        query: searchParams.get('q') || undefined,
        year: searchParams.get('year') || undefined,
        month: searchParams.get('month') || undefined,
        sortKey: (searchParams.get('sort') as keyof Project) || 'created_at',
        sortDir: (searchParams.get('dir') as 'asc' | 'desc') || 'desc',
        currentPage: Number(searchParams.get('page')) || 1,
    };

    // Llamamos a nuestra función de servidor que hace todo el trabajo pesado
    const { data, count } = await getProjectsForUser(params);

    return NextResponse.json({ data, count });

  } catch (error) {
    logError(error, { route: '/api/projects' });
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}