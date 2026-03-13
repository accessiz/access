import { Skeleton } from "@/components/ui/skeleton"

export default function BirthdaysLoading() {
    return (
        <div className="flex flex-col gap-6 w-full h-full animate-pulse">
            {/* Header */}
            <header className="flex flex-col gap-x-4 gap-y-4 pb-4 border-b sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Skeleton className="h-8 w-36" />
                </div>
                <Skeleton className="h-10 w-32 rounded-lg" />
            </header>

            {/* Month selector */}
            <div className="flex items-center justify-between">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-10 w-10 rounded-full" />
            </div>

            {/* Today's birthday card (featured) */}
            <div className="p-6 bg-[rgb(var(--sys-bg-secondary))] rounded-2xl border-2 border-dashed">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-6 w-6" />
                    <Skeleton className="h-6 w-48" />
                </div>
            </div>

            {/* Birthday Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-3 p-4 bg-[rgb(var(--sys-bg-secondary))] rounded-2xl">
                        {/* Photo + Badge */}
                        <div className="relative">
                            <Skeleton className="aspect-square w-full rounded-xl" />
                            <Skeleton className="absolute top-2 right-2 h-6 w-12 rounded-full" />
                        </div>

                        {/* Name */}
                        <Skeleton className="h-5 w-3/4" />

                        {/* Date + Age */}
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-12" />
                        </div>

                        {/* Instagram button */}
                        <Skeleton className="h-9 w-full rounded-lg" />
                    </div>
                ))}
            </div>
        </div>
    )
}
