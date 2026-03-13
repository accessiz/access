import { Skeleton } from "@/components/ui/skeleton"

export default function ClientsLoading() {
    return (
        <div className="flex flex-col gap-6 w-full h-full animate-pulse">
            {/* Header */}
            <header className="flex flex-col gap-x-4 gap-y-4 pb-4 border-b sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Skeleton className="h-8 w-28" />
                </div>
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-64 rounded-lg" />
                    <Skeleton className="h-10 w-32 rounded-lg" />
                </div>
            </header>

            {/* Client Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-4 p-6 bg-[rgb(var(--sys-bg-secondary))] rounded-2xl">
                        {/* Header: Logo + Name + Menu */}
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="flex flex-col gap-1">
                                    <Skeleton className="h-5 w-32" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                            </div>
                            <Skeleton className="h-8 w-8 rounded-lg" />
                        </div>

                        {/* Brands */}
                        <div className="flex flex-wrap gap-2">
                            <Skeleton className="h-6 w-16 rounded-full" />
                            <Skeleton className="h-6 w-20 rounded-full" />
                            <Skeleton className="h-6 w-14 rounded-full" />
                        </div>

                        {/* Stats */}
                        <div className="flex items-center justify-between pt-3 border-t">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-20" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
