import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
    return (
        <div role="status" aria-label="Cargando dashboard" className="grid gap-6 motion-safe:animate-pulse">
            <span className="sr-only">Cargando contenido del dashboard...</span>
            {/* Header */}
            <header className="flex flex-col gap-x-4 gap-y-4 pb-4 border-b sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Skeleton className="h-8 w-32" />
                </div>

                <div className="flex w-full sm:w-auto sm:ml-auto flex-col gap-3 sm:flex-row sm:items-center sm:justify-end sm:flex-wrap">
                    <Skeleton className="w-full sm:w-95 h-10 rounded-lg" />
                    <div className="w-full flex items-stretch gap-3 sm:w-auto">
                        <Skeleton className="h-10 flex-1 sm:w-32 rounded-lg" />
                        <Skeleton className="h-10 flex-1 sm:w-32 rounded-lg" />
                    </div>
                </div>
            </header>

            {/* KPI Cards Row */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-3 p-4 bg-[rgb(var(--sys-bg-secondary))] rounded-2xl">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-5 w-5 rounded" />
                        </div>
                        <Skeleton className="h-10 w-16" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                ))}
            </div>

            {/* Two Column Cards */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Actividad Reciente */}
                <div className="flex flex-col gap-4 p-6 bg-[rgb(var(--sys-bg-secondary))] rounded-2xl">
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-6 w-36" />
                        <Skeleton className="h-4 w-28" />
                    </div>
                    <div className="flex flex-col gap-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex flex-col gap-1 p-3 bg-quaternary rounded-md">
                                <Skeleton className="h-4 w-48" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Perfiles Incompletos */}
                <div className="flex flex-col gap-4 p-6 bg-[rgb(var(--sys-bg-secondary))] rounded-2xl">
                    <Skeleton className="h-6 w-40" />
                    <div className="flex flex-col gap-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="flex-1 flex flex-col gap-1">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-2 w-full rounded-full" />
                                </div>
                                <Skeleton className="h-4 w-8" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
