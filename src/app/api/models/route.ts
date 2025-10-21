
import { NextResponse, type NextRequest } from 'next/server';
import { getModelsEnriched } from '@/lib/api/models';
import { logError } from '@/lib/utils/errors';
import { Model } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Extraemos todos los parámetros de la URL
    const params = {
        query: searchParams.get('q') || undefined,
        country: searchParams.get('country') || undefined,
        minHeight: searchParams.get('minHeight') || undefined,
        maxHeight: searchParams.get('maxHeight') || undefined,
        sortKey: (searchParams.get('sort') as keyof Model) || 'alias',
        sortDir: (searchParams.get('dir') as 'asc' | 'desc') || 'asc',
        currentPage: Number(searchParams.get('page')) || 1,
    };

    // Llamamos a nuestra función de servidor que hace todo el trabajo
    const { data, count } = await getModelsEnriched(params);

    return NextResponse.json({ data, count });

  } catch (error) {
    logError(error, { route: '/api/models' });
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    );
  }
}
