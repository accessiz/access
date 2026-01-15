import { Skeleton } from "@/components/ui/skeleton"

export default function ModelsLoading() {
    return (
        <div className="flex flex-col gap-6 w-full h-full animate-pulse">
            {/* Header */}
            <header className="flex flex-col gap-x-4 gap-y-4 pb-4 border-b sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Skeleton className="h-8 w-32" />
                </div>
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-64 rounded-lg" />
                    <Skeleton className="h-10 w-28 rounded-lg" />
                </div>
            </header>

            {/* Filters Row - SegmentedControl + Country filter */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-72 rounded-full" />
                    <Skeleton className="h-10 w-40 rounded-lg" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <Skeleton className="h-9 w-9 rounded-lg" />
                </div>
            </div>

            {/* Grid of Model Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {Array.from({ length: 24 }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-2">
                        {/* Photo placeholder */}
                        <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
                        {/* Name */}
                        <Skeleton className="h-4 w-3/4 mx-auto" />
                        {/* Progress bar */}
                        <Skeleton className="h-2 w-full rounded-full" />
                    </div>
                ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center gap-2 mt-4">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
        </div>
    )
}
