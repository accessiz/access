import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AlertsClientPage from './alerts-client-page';

export default async function AlertsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    return <AlertsClientPage />;
}
