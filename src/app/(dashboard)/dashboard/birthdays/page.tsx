import { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

const BirthdaysClientPage = dynamic(
    () => import('./birthdays-client-page').then(mod => ({ default: mod.BirthdaysClientPage })),
    {
        loading: () => (
            <div className="grid gap-6">
                <Skeleton className="h-12 w-48" />
                <Skeleton className="h-[300px] w-full" />
            </div>
        )
    }
)

export const metadata: Metadata = {
    title: 'Cumpleaños | Dashboard',
    description: 'Gestión de cumpleaños del talento',
}

export default function BirthdaysPage() {
    return <BirthdaysClientPage />
}
