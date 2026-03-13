import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logError } from '@/lib/utils/errors';
import { applyRateLimit, apiLimiter, strictLimiter } from '@/lib/utils/rate-limit';

export async function GET(req: NextRequest) {
    const blocked = applyRateLimit(req, apiLimiter);
    if (blocked) return blocked;

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
        }

        // Solo obtener notificaciones urgentes NO LEÍDAS
        const { data, error } = await supabase
            .from('activity_logs')
            .select('id, category, title, message, created_at, metadata, is_urgent')
            .eq('user_id', user.id)
            .eq('is_urgent', true)
            .eq('is_read', false)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            logError(error, { route: '/api/notifications' });
            return NextResponse.json({ success: false, error: 'Could not fetch notifications' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: data?.map(log => ({
                id: log.id,
                type: log.category,
                title: log.title,
                when: log.created_at,
                meta: log.message || undefined,
            })) || []
        }, {
            headers: {
                // Cache por 60s, permite servir stale mientras revalida
                'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
            }
        });
    } catch (err) {
        logError(err, { route: '/api/notifications' });
        return NextResponse.json({ success: false, error: 'Could not fetch notifications' }, { status: 500 });
    }
}

// DELETE: Mark all notifications as read
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
            .from('activity_logs')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('is_urgent', true)
            .eq('is_read', false);

        if (error) {
            logError(error, { route: '/api/notifications DELETE' });
            return NextResponse.json({ success: false, error: 'Could not mark notifications as read' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        logError(err, { route: '/api/notifications DELETE' });
        return NextResponse.json({ success: false, error: 'Could not mark notifications as read' }, { status: 500 });
    }
}
