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
                    className="h-12 w-12 md:h-10 md:w-10 relative hover:bg-hover-overlay"
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
                align="center"
                collisionPadding={16}
                className="w-[calc(100vw-2rem)] sm:w-96 p-0 bg-background/80 backdrop-blur-md border-separator/50 shadow-2xl overflow-hidden z-[100]"
                sideOffset={8}
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-separator px-4 py-3">
                    <h4 className="text-body font-semibold text-primary">Notificaciones</h4>
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
                                <div className="border-b border-separator">
                                    <div className="px-4 py-2 bg-warning/10">
                                        <span className="text-label font-medium text-primary flex items-center gap-1.5 opacity-80 uppercase tracking-wider">
                                            <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                                            Requiere acción
                                        </span>
                                    </div>
                                    <TooltipProvider delayDuration={200}>
                                        <ul className="divide-y divide-separator">
                                            {alerts.map((alert) => (
                                                <li key={alert.id}>
                                                    <div className="flex items-center gap-2 pr-4">
                                                        <Link
                                                            href={alert.href}
                                                            className="flex-1 flex items-start gap-4 px-4 py-4 focus:outline-none"
                                                            onClick={() => setIsOpen(false)}
                                                        >
                                                            {/* Column 1: Icon */}
                                                            <div className={cn(
                                                                "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                                                                alert.type === 'payment_due' ? "bg-warning/20 text-warning" : "bg-info/20 text-info"
                                                            )}>
                                                                {alert.type === 'payment_due' ? <DollarSign className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                                                            </div>
                                                            {/* Column 2: Info */}
                                                            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                                                <p className="text-body text-primary font-semibold line-clamp-2 leading-snug">
                                                                    {alert.title}
                                                                </p>
                                                                {alert.subtitle && (
                                                                    <p className="text-label text-secondary line-clamp-1">
                                                                        {alert.subtitle}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </Link>
                                                        {/* Column 3: Action Icon (i) */}
                                                        {alert.type === 'attention_needed' && (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        className="p-2 -mr-2 rounded-full shrink-0"
                                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                                                    >
                                                                        <Info className="h-5 w-5 text-[rgb(var(--purple))]" />
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent
                                                                    side="left"
                                                                    className="max-w-[240px] bg-[rgb(var(--purple))] border-none text-white shadow-xl p-3 z-[100]"
                                                                >
                                                                    <p className="text-label leading-relaxed font-medium">
                                                                        Aprueba talentos para completar o elimina el proyecto
                                                                    </p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </TooltipProvider>
                                </div>
                            )}

                            {/* Regular Notifications */}
                            {notifications.length > 0 && (
                                <ul className="divide-y divide-separator">
                                    {notifications.map((notification) => (
                                        <li key={notification.id}>
                                            <div className="flex items-center gap-2 pr-4">
                                                <Link
                                                    href="/dashboard/projects"
                                                    className="flex-1 flex items-start gap-4 px-4 py-4 focus:outline-none"
                                                    onClick={() => setIsOpen(false)}
                                                >
                                                    {/* Column 1: Icon */}
                                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                        <FolderKanban className="h-5 w-5 text-primary" />
                                                    </div>
                                                    {/* Column 2: Info */}
                                                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                                        <p className="text-body text-primary line-clamp-2 leading-snug">
                                                            {notification.title}
                                                        </p>
                                                        <p className="text-label text-secondary mt-0.5">
                                                            {timeAgo(notification.when)}
                                                        </p>
                                                    </div>
                                                </Link>
                                                {/* Column 3: Action Icon (i) */}
                                                <TooltipProvider delayDuration={200}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button
                                                                className="p-2 -mr-2 rounded-full shrink-0"
                                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                                            >
                                                                <Info className="h-5 w-5 text-[rgb(var(--purple))]" />
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent
                                                            side="left"
                                                            className="max-w-[240px] bg-[rgb(var(--purple))] border-none text-white shadow-xl p-3 z-[100]"
                                                        >
                                                            <p className="text-label leading-relaxed font-medium">
                                                                Nueva actualización del proyecto. Haz clic para más detalles.
                                                            </p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
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
