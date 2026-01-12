'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, Check, Loader2, FolderKanban, DollarSign, FileText, AlertTriangle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Notification {
    id: string
    type: string
    title: string
    when: string
    meta?: string
}

interface SmartAlert {
    id: string
    type: 'payment_due' | 'invoice_reminder' | 'attention_needed'
    title: string
    subtitle?: string
    priority: 'high' | 'medium'
    href: string
}

// Helper para tiempo relativo
function timeAgo(dateString: string): string {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Ahora'
    if (diffMins < 60) return `Hace ${diffMins} min`
    if (diffHours < 24) return `Hace ${diffHours}h`
    if (diffDays < 7) return `Hace ${diffDays}d`
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export function NotificationButton() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [alerts, setAlerts] = useState<SmartAlert[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [hasLoaded, setHasLoaded] = useState(false)

    // Fetch notifications y alerts
    const fetchAll = useCallback(async () => {
        if (isLoading) return
        setIsLoading(true)
        try {
            // Fetch both in parallel
            const [notifRes, alertsRes] = await Promise.all([
                fetch('/api/notifications'),
                fetch('/api/alerts'),
            ])

            const notifJson = await notifRes.json()
            if (notifJson.success && Array.isArray(notifJson.data)) {
                setNotifications(notifJson.data)
            }

            const alertsJson = await alertsRes.json()
            if (alertsJson.success && Array.isArray(alertsJson.data)) {
                setAlerts(alertsJson.data)
            }
        } catch (error) {
            console.error('[Notifications] Error fetching:', error)
        } finally {
            setIsLoading(false)
            setHasLoaded(true)
        }
    }, [isLoading])

    // Cargar cuando se abre el popover
    useEffect(() => {
        if (isOpen && !hasLoaded) {
            fetchAll()
        }
    }, [isOpen, hasLoaded, fetchAll])

    // Cargar al montar y refrescar cada 60 segundos
    useEffect(() => {
        fetchAll()
        const interval = setInterval(fetchAll, 60000)
        return () => clearInterval(interval)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Marcar notificaciones como leídas (no afecta alerts)
    const handleMarkAllRead = async () => {
        try {
            await fetch('/api/notifications', { method: 'DELETE' })
            setNotifications([])
        } catch (error) {
            console.error('[Notifications] Error marking as read:', error)
        }
    }

    const totalCount = notifications.length + alerts.length
    const hasAlerts = alerts.length > 0

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 md:h-10 md:w-10 relative"
                    title="Notificaciones"
                >
                    <Bell className="h-4 w-4" />
                    {totalCount > 0 && (
                        <span className={cn(
                            "absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full text-label font-medium flex items-center justify-center",
                            hasAlerts ? "bg-warning text-warning-foreground" : "bg-primary text-primary-foreground animate-pulse"
                        )}>
                            {totalCount > 9 ? '9+' : totalCount}
                        </span>
                    )}
                    <span className="sr-only">Notificaciones</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="end"
                className="w-80 p-0"
                sideOffset={8}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <h4 className="text-body font-semibold">Notificaciones</h4>
                    {notifications.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-label text-muted-foreground hover:text-foreground"
                            onClick={handleMarkAllRead}
                        >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Marcar leídas
                        </Button>
                    )}
                </div>

                {/* Content */}
                <div className="max-h-96 overflow-y-auto">
                    {isLoading && !hasLoaded ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : totalCount === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                <Bell className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <p className="text-body text-muted-foreground">
                                Sin notificaciones
                            </p>
                            <p className="text-label text-muted-foreground/70 mt-1">
                                Las alertas y acciones aparecerán aquí
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Smart Alerts (persistentes) */}
                            {alerts.length > 0 && (
                                <div className="border-b">
                                    <div className="px-4 py-2 bg-warning/10">
                                        <span className="text-label font-medium text-warning flex items-center gap-1.5">
                                            <AlertTriangle className="h-3.5 w-3.5" />
                                            Requiere acción
                                        </span>
                                    </div>
                                    <TooltipProvider delayDuration={200}>
                                        <ul className="divide-y divide-border">
                                            {alerts.map((alert) => (
                                                <li key={alert.id}>
                                                    <Link
                                                        href={alert.href}
                                                        className={cn(
                                                            "flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors",
                                                            "focus:outline-none focus:bg-muted/50"
                                                        )}
                                                        onClick={() => setIsOpen(false)}
                                                    >
                                                        <div className={cn(
                                                            "h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                                                            alert.type === 'payment_due' ? "bg-warning/20" :
                                                                alert.type === 'attention_needed' ? "bg-info/20" : "bg-info/20"
                                                        )}>
                                                            {alert.type === 'payment_due' ? (
                                                                <DollarSign className="h-4 w-4 text-warning" />
                                                            ) : alert.type === 'attention_needed' ? (
                                                                <FileText className="h-4 w-4 text-info" />
                                                            ) : (
                                                                <FileText className="h-4 w-4 text-info" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <p className="text-body text-foreground font-medium line-clamp-1">
                                                                    {alert.title}
                                                                </p>
                                                                {alert.type === 'attention_needed' && (
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <span
                                                                                className="shrink-0 cursor-help"
                                                                                onClick={(e) => e.preventDefault()}
                                                                            >
                                                                                <Info className="h-3.5 w-3.5 text-info" />
                                                                            </span>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent
                                                                            side="top"
                                                                            className="max-w-[200px] text-center"
                                                                        >
                                                                            <p className="text-label">
                                                                                Aprueba talentos para completar o elimina el proyecto
                                                                            </p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                            </div>
                                                            {alert.subtitle && (
                                                                <p className="text-label text-muted-foreground line-clamp-1">
                                                                    {alert.subtitle}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </TooltipProvider>
                                </div>
                            )}

                            {/* Regular Notifications */}
                            {notifications.length > 0 && (
                                <ul className="divide-y divide-border">
                                    {notifications.map((notification) => (
                                        <li key={notification.id}>
                                            <Link
                                                href="/dashboard/projects"
                                                className={cn(
                                                    "flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors",
                                                    "focus:outline-none focus:bg-muted/50"
                                                )}
                                                onClick={() => setIsOpen(false)}
                                            >
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                                    <FolderKanban className="h-4 w-4 text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-body text-foreground line-clamp-2">
                                                        {notification.title}
                                                    </p>
                                                    <p className="text-label text-muted-foreground mt-0.5">
                                                        {timeAgo(notification.when)}
                                                    </p>
                                                </div>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}
