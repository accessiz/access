import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsLoading() {
    return (
        <div className="flex flex-col gap-6 w-full max-w-2xl lg:max-w-none h-full animate-pulse">
            {/* Header */}
            <header className="flex flex-col gap-x-4 gap-y-4 pb-4 border-b sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Skeleton className="h-8 w-36" />
                </div>
            </header>

            <div className="grid gap-6">
                {/* Appearance Card */}
                <div className="flex flex-col gap-4 p-6 bg-[rgb(var(--sys-bg-secondary))] rounded-2xl">
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-6 w-28" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                    <div className="flex gap-3">
                        <Skeleton className="h-10 flex-1 rounded-lg" />
                        <Skeleton className="h-10 flex-1 rounded-lg" />
                    </div>
                </div>

                {/* Contact Card */}
                <div className="flex flex-col gap-4 p-6 bg-[rgb(var(--sys-bg-secondary))] rounded-2xl">
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-6 w-44" />
                        <Skeleton className="h-4 w-72" />
                    </div>

                    {/* Email field */}
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-10 w-full rounded-lg" />
                    </div>

                    {/* Phone field */}
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full rounded-lg" />
                    </div>

                    {/* Save button */}
                    <Skeleton className="h-10 w-full rounded-lg" />
                </div>
            </div>
        </div>
    )
}
