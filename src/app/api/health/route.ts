import { NextResponse } from 'next/server';

/**
 * Lightweight health-check endpoint for uptime monitors.
 * Returns { status: 'ok', timestamp } with no auth required.
 */
export function GET() {
  return NextResponse.json(
    { status: 'ok', timestamp: new Date().toISOString() },
    {
      headers: {
        'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=300',
      },
    }
  );
}
