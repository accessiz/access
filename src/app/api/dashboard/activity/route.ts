import { NextResponse } from 'next/server';
import { getRecentActivity } from '@/lib/api/dashboard';
import { logError } from '@/lib/utils/errors';

export async function GET() {
  try {
    const data = await getRecentActivity(50);
    return NextResponse.json({ success: true, data }, {
      headers: {
        // Cache por 30s, permite servir stale mientras revalida
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
      }
    });
  } catch (err) {
    logError(err, { route: '/api/dashboard/activity' });
    return NextResponse.json({ success: false, error: 'Could not fetch activity' }, { status: 500 });
  }
}
