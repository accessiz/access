'use client'

import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NotificationButtonProps {
    count?: number
}

export function NotificationButton({ count = 0 }: NotificationButtonProps) {
    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 md:h-10 md:w-10 relative"
            title="Notificaciones"
        >
            <Bell className="h-4 w-4" />
            {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-label font-medium text-primary-foreground flex items-center justify-center">
                    {count > 9 ? '9+' : count}
                </span>
            )}
            <span className="sr-only">Notificaciones</span>
        </Button>
    )
}
