import { NextRequest, NextResponse } from 'next/server';
import { getRecentActivity } from '@/lib/api/dashboard';
import { logError } from '@/lib/utils/errors';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit, apiLimiter } from '@/lib/utils/rate-limit';

export async function GET(req: NextRequest) {
  const blocked = applyRateLimit(req, apiLimiter);
  if (blocked) return blocked;

  try {
    // Auth check — reject unauthenticated callers
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

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
