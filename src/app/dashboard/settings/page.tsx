import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SettingsClientPage from './settings-client-page';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }

    // Obtener metadata del usuario (email y teléfono de la agencia)
    const agencyEmail = user.user_metadata?.agency_email || '';
    const agencyPhone = user.user_metadata?.agency_phone || '';

    return (
        <SettingsClientPage
            initialEmail={agencyEmail}
            initialPhone={agencyPhone}
        />
    );
}
