import { Skeleton } from "@/components/ui/skeleton"

export default function AlertsLoading() {
    return (
        <div className="flex flex-col gap-6 w-full h-full animate-pulse">
            {/* Header */}
            <header className="flex flex-col gap-x-4 gap-y-4 pb-4 border-b sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-28" />
                    <Skeleton className="h-6 w-8 rounded-full" />
                </div>
                <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <Skeleton className="h-9 w-32 rounded-lg" />
                </div>
            </header>

            {/* Alert Type Filters */}
            <div className="flex flex-wrap gap-2">
                <Skeleton className="h-8 w-20 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-full" />
                <Skeleton className="h-8 w-28 rounded-full" />
            </div>

            {/* Alert Cards */}
            <div className="flex flex-col gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-[rgb(var(--sys-bg-secondary))] rounded-2xl">
                        {/* Icon */}
                        <Skeleton className="h-10 w-10 rounded-full shrink-0" />

                        {/* Content */}
                        <div className="flex-1 flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-5 w-48" />
                                <Skeleton className="h-5 w-16 rounded-full" />
                            </div>
                            <Skeleton className="h-4 w-64" />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-8 w-8 rounded-lg" />
                            <Skeleton className="h-8 w-8 rounded-lg" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
