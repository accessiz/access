'use client'

import { ThemeToggle } from '@/components/molecules/ThemeToggle'
import { NotificationButton } from '@/components/molecules/NotificationButton'

export function HeaderActions() {
    return (
        <div className="flex items-center gap-1">
            <NotificationButton />
            <ThemeToggle />
        </div>
    )
}
