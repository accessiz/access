import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

const WebVisibilityClientPage = dynamic(
    () => import('./web-client-page'),
    {
        loading: () => (
            <div className="grid gap-6">
                <Skeleton className="h-12 w-48" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        )
    }
)

export const metadata = {
    title: 'Visibilidad Web | NYXA ACCESS',
}

export default function WebPage() {
    return <WebVisibilityClientPage />
}
