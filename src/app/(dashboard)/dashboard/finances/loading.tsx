import { Skeleton } from "@/components/ui/skeleton"

export default function FinancesLoading() {
    return (
        <div className="flex flex-col gap-6 w-full h-full animate-pulse">
            {/* Header */}
            <header className="flex flex-col gap-x-4 gap-y-4 pb-4 border-b sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Skeleton className="h-8 w-28" />
                </div>
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-28 rounded-lg" />
                    <Skeleton className="h-10 w-28 rounded-lg" />
                </div>
            </header>

            {/* KPI Cards Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-3 p-4 bg-[rgb(var(--sys-bg-secondary))] rounded-2xl">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-5 w-5 rounded" />
                        </div>
                        <Skeleton className="h-8 w-28" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <Skeleton className="h-10 w-80 rounded-full" />

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-3">
                <Skeleton className="h-9 w-32 rounded-lg" />
                <Skeleton className="h-9 w-32 rounded-lg" />
                <Skeleton className="h-9 w-40 rounded-lg" />
            </div>

            {/* Payment Cards */}
            <div className="grid gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-[rgb(var(--sys-bg-secondary))] rounded-2xl">
                        {/* Left: Avatar + Info */}
                        <div className="flex items-center gap-3 flex-1">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="flex flex-col gap-1">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-4 w-48" />
                            </div>
                        </div>

                        {/* Right: Amount + Actions */}
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end gap-1">
                                <Skeleton className="h-6 w-24" />
                                <Skeleton className="h-4 w-16" />
                            </div>
                            <Skeleton className="h-9 w-24 rounded-lg" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
