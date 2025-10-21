import { NextResponse } from 'next/server';
import { getRecentActivity } from '@/lib/api/dashboard';

export async function GET() {
  try {
    const data = await getRecentActivity(50);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Error in /api/dashboard/activity', err);
    return NextResponse.json({ success: false, error: 'Could not fetch activity' }, { status: 500 });
  }
}
