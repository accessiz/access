import { NextResponse } from 'next/server';
import { getRecentActivity } from '@/lib/api/dashboard';
import { logError } from '@/lib/utils/errors';

export async function GET() {
  try {
    const data = await getRecentActivity(50);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    logError(err, { route: '/api/dashboard/activity' });
    return NextResponse.json({ success: false, error: 'Could not fetch activity' }, { status: 500 });
  }
}
