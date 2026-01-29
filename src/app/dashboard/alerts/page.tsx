import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const AlertsClientPage = dynamic(
    () => import('./alerts-client-page'),
    {
        loading: () => (
            <div className="grid gap-6">
                <Skeleton className="h-12 w-48" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        )
    }
)

export default async function AlertsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    return <AlertsClientPage />;
}
