import { Skeleton } from "@/components/ui/skeleton"

export default function ProjectsLoading() {
    return (
        <div className="flex flex-col gap-6 w-full h-full animate-pulse">
            {/* Header */}
            <header className="flex flex-col gap-x-4 gap-y-4 pb-4 border-b sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Skeleton className="h-8 w-32" />
                </div>
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-64 rounded-lg" />
                    <Skeleton className="h-10 w-32 rounded-lg" />
                </div>
            </header>

            {/* Filters - Status tabs + Year selector */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <Skeleton className="h-10 w-[420px] rounded-full" />
                <Skeleton className="h-10 w-28 rounded-lg" />
            </div>

            {/* Table Header */}
            <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-4 py-2 border-b">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
            </div>

            {/* Project Rows */}
            {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="flex flex-col md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-2 md:gap-4 p-4 bg-[rgb(var(--sys-bg-secondary))] rounded-2xl">
                    <div className="flex flex-col gap-1">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                    <div className="flex gap-2">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-6 w-6 rounded-full" />
                    </div>
                </div>
            ))}

            {/* Pagination */}
            <div className="flex justify-center gap-2 mt-4">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
        </div>
    )
}
