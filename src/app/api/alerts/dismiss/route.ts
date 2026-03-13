import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logError } from '@/lib/utils/errors';
import { applyRateLimit, strictLimiter } from '@/lib/utils/rate-limit';
import { z } from 'zod';

const dismissSchema = z.object({
    alert_id: z.string().min(1).max(200),
});

// Dismiss a single alert (snooze for 24 hours)
export async function POST(request: NextRequest) {
    const blocked = applyRateLimit(request, strictLimiter);
    if (blocked) return blocked;

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();
        const parsed = dismissSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ success: false, error: 'alert_id is required and must be a valid string' }, { status: 400 });
        }

        const { alert_id } = parsed.data;

        // Upsert dismissal (extends if already exists)
        const { error } = await supabase
            .from('alert_dismissals')
            .upsert({
                user_id: user.id,
                alert_id,
                dismissed_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            }, {
                onConflict: 'user_id,alert_id',
            });

        if (error) {
            logError(error, { route: '/api/alerts/dismiss', action: 'upsert' });
            return NextResponse.json({ success: false, error: 'Failed to dismiss alert' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Alert dismissed for 24 hours' });
    } catch (err) {
        logError(err, { route: '/api/alerts/dismiss' });
        return NextResponse.json({ success: false, error: 'Could not dismiss alert' }, { status: 500 });
    }
}

// Delete a dismissal (unsnooze)
export async function DELETE(request: NextRequest) {
    const blocked = applyRateLimit(request, strictLimiter);
    if (blocked) return blocked;

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const alertId = searchParams.get('alert_id');

        if (!alertId || alertId.length > 200) {
            return NextResponse.json({ success: false, error: 'alert_id is required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('alert_dismissals')
            .delete()
            .eq('user_id', user.id)
            .eq('alert_id', alertId);

        if (error) {
            logError(error, { route: '/api/alerts/dismiss', action: 'delete' });
            return NextResponse.json({ success: false, error: 'Failed to unsnooze alert' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Alert unsnoozed' });
    } catch (err) {
        logError(err, { route: '/api/alerts/dismiss' });
        return NextResponse.json({ success: false, error: 'Could not unsnooze alert' }, { status: 500 });
    }
}
