import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logError } from '@/lib/utils/errors';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('models')
            .select('id, alias, full_name, cover_path, is_public, gender')
            .eq('user_id', user.id)
            .order('alias', { ascending: true })
            .range(0, 999); // Obtener todos los modelos (hasta 1000)

        if (error) {
            logError(error, { route: '/api/models' });
            return NextResponse.json({ success: false, error: 'Could not fetch models' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: data || [] });
    } catch (err) {
        logError(err, { route: '/api/models' });
        return NextResponse.json({ success: false, error: 'Could not fetch models' }, { status: 500 });
    }
}
