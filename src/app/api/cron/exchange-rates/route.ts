import { updateTodayRate } from '@/lib/actions/exchange-rates';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { serverEnv } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        const cronSecret = serverEnv.CRON_SECRET;
        if (authHeader !== `Bearer ${cronSecret}`) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const result = await updateTodayRate();

        if (result.success) {
            return NextResponse.json({ success: true, rate: result.rate });
        } else {
            return NextResponse.json({ success: false, error: result.error }, { status: 500 });
        }
    } catch {
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
