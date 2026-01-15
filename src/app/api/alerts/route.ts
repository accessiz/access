import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logError } from '@/lib/utils/errors';
import { getComputedAlerts } from '@/lib/services/alertsService';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const includeDismissed = searchParams.get('include_dismissed') === 'true';

        const alerts = await getComputedAlerts(user.id, includeDismissed);

        return NextResponse.json({
            success: true,
            data: alerts,
            count: alerts.length,
        });
    } catch (err) {
        logError(err, { route: '/api/alerts' });
        return NextResponse.json({ success: false, error: 'Could not fetch alerts' }, { status: 500 });
    }
}
