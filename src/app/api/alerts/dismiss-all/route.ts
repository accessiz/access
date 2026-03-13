import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logError } from '@/lib/utils/errors';
import { getComputedAlerts } from '@/lib/services/alertsService';
import { applyRateLimit, strictLimiter } from '@/lib/utils/rate-limit';

// Dismiss all current alerts (snooze for 24 hours)
export async function POST(req: NextRequest) {
    const blocked = applyRateLimit(req, strictLimiter);
    if (blocked) return blocked;

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
        }

        // Use the service directly instead of fetching
        const alerts = await getComputedAlerts(user.id, false); // Get only active alerts to dismiss

        if (alerts.length === 0) {
            return NextResponse.json({ success: true, message: 'No alerts to dismiss', count: 0 });
        }

        // Create dismissals for all alerts
        const dismissals = alerts.map((alert) => ({
            user_id: user.id,
            alert_id: alert.id,
            dismissed_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }));

        const { error } = await supabase
            .from('alert_dismissals')
            .upsert(dismissals, {
                onConflict: 'user_id,alert_id',
            });

        if (error) {
            logError(error, { route: '/api/alerts/dismiss-all', action: 'upsert' });
            return NextResponse.json({ success: false, error: 'Failed to dismiss alerts' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `${alerts.length} alerts dismissed for 24 hours`,
            count: alerts.length,
        });
    } catch (err) {
        logError(err, { route: '/api/alerts/dismiss-all' });
        return NextResponse.json({ success: false, error: 'Could not dismiss alerts' }, { status: 500 });
    }
}

// Clear all dismissals (show all alerts again)
export async function DELETE(req: NextRequest) {
    const blocked = applyRateLimit(req, strictLimiter);
    if (blocked) return blocked;

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
        }

        const { error } = await supabase
            .from('alert_dismissals')
            .delete()
            .eq('user_id', user.id);

        if (error) {
            logError(error, { route: '/api/alerts/dismiss-all', action: 'delete' });
            return NextResponse.json({ success: false, error: 'Failed to clear dismissals' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'All dismissals cleared' });
    } catch (err) {
        logError(err, { route: '/api/alerts/dismiss-all' });
        return NextResponse.json({ success: false, error: 'Could not clear dismissals' }, { status: 500 });
    }
}
