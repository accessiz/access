import { Skeleton } from "@/components/ui/skeleton"

export default function WebVisibilityLoading() {
    return (
        <div className="flex flex-col gap-6 w-full h-full animate-pulse">
            {/* Header */}
            <header className="flex flex-col gap-x-4 gap-y-4 pb-4 border-b sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Skeleton className="h-8 w-40" />
                </div>
            </header>

            {/* Layout: Sidebar + Content */}
            <div className="flex gap-6">
                {/* Sidebar with filters */}
                <div className="hidden md:flex flex-col gap-4 w-64 shrink-0">
                    {/* Search */}
                    <Skeleton className="h-10 w-full rounded-lg" />

                    {/* Gender filter */}
                    <Skeleton className="h-10 w-full rounded-full" />

                    {/* Visibility filter */}
                    <Skeleton className="h-10 w-full rounded-full" />

                    {/* Model list */}
                    <div className="flex flex-col gap-2 mt-4">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 p-2 rounded-lg">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-6 w-10 ml-auto rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content - Preview */}
                <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 bg-[rgb(var(--sys-bg-secondary))] rounded-2xl min-h-[400px]">
                    <Skeleton className="h-10 w-10 rounded" />
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
            </div>
        </div>
    )
}
