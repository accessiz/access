import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import dynamicImport from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const SettingsClientPage = dynamicImport(
    () => import('./settings-client-page'),
    {
        loading: () => (
            <div className="grid gap-6">
                <Skeleton className="h-12 w-48" />
                <Skeleton className="h-[300px] w-full" />
            </div>
        )
    }
)

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
