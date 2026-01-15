import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
    return (
        <div className="flex flex-col gap-6 p-4 sm:p-6 w-full h-full animate-pulse">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-24 rounded-lg" />
                    <Skeleton className="h-9 w-28 rounded-lg" />
                </div>
            </div>

            {/* Separator */}
            <Skeleton className="h-px w-full" />

            {/* Tabs/Filters Skeleton */}
            <div className="flex gap-4">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-18" />
                <Skeleton className="h-8 w-22" />
            </div>

            {/* Content Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-4 p-4 rounded-[24px] bg-sys-bg-secondary">
                        <Skeleton className="h-6 w-20 rounded-md" />
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-3/4" />
                        <div className="flex gap-3 mt-4">
                            <Skeleton className="h-10 flex-1 rounded-lg" />
                            <Skeleton className="h-10 flex-1 rounded-lg" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
