'use client';

import { useState, useEffect } from 'react';
import {
    AlertTriangle,
    Users,
    Clock,
    BellOff,
    ExternalLink,
    RefreshCw,
    Loader2,
    Folder,
    CheckCircle2,
    Wallet,
    FileText,
    DollarSign,
    Lightbulb,
    ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ExpandButton } from '@/components/molecules/ExpandButton';

type SmartAlert = {
    id: string;
    type: 'payment_due' | 'invoice_reminder' | 'attention_needed' | 'missing_revenue';
    title: string;
    subtitle?: string;
    priority: 'high' | 'medium';
    href: string;
    metadata: {
        project_id?: string;
        model_id?: string;
        assignment_id?: string;
        amount?: number;
        currency?: string;
    };
    is_dismissed?: boolean;
    problem: string;
    solution: string;
};

const ALERT_TYPE_CONFIG = {
    payment_due: {
        label: 'Pagos',
        icon: Wallet,
        color: 'text-[rgb(var(--red))]',
        badgeVariant: 'danger' as const,
    },
    invoice_reminder: {
        label: 'Facturas',
        icon: FileText,
        color: 'text-[rgb(var(--yellow))]',
        badgeVariant: 'warning' as const,
    },
    attention_needed: {
        label: 'Talento',
        icon: Users,
        color: 'text-[rgb(var(--purple))]',
        badgeVariant: 'info' as const,
    },
    missing_revenue: {
        label: 'Sin Monto',
        icon: DollarSign,
        color: 'text-[rgb(var(--orange))]',
        badgeVariant: 'neutral' as const,
    },
};

type FilterType = 'all' | 'payment_due' | 'invoice_reminder' | 'attention_needed' | 'missing_revenue';

export default function AlertsClientPage() {
    const [alerts, setAlerts] = useState<SmartAlert[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDismissing, setIsDismissing] = useState<string | null>(null);
    const [isDismissingAll, setIsDismissingAll] = useState(false);
    const [filter, setFilter] = useState<FilterType>('all');
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    // Derived state: is any card currently expanded?
    const hasAnyExpanded = expandedIds.size > 0;

    // Fetch alerts including dismissed ones
    const fetchAlerts = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/alerts?include_dismissed=true');
            if (response.ok) {
                const data = await response.json();
                setAlerts(data.data || []);
            }
        } catch {
            toast.error('Error al cargar alertas');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
    }, []);

    const handleDismiss = async (alertId: string) => {
        setIsDismissing(alertId);
        try {
            const response = await fetch('/api/alerts/dismiss', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ alert_id: alertId }),
            });

            if (response.ok) {
                // Update local state without removing
                setAlerts(prev => prev.map(a =>
                    a.id === alertId ? { ...a, is_dismissed: true } : a
                ));
                // Dispatch event to update bell
                window.dispatchEvent(new Event('alerts-updated'));
                toast.success('Alerta aplazada por 24 horas');
            } else {
                toast.error('Error al aplazar alerta');
            }
        } catch {
            toast.error('Error al aplazar alerta');
        } finally {
            setIsDismissing(null);
        }
    };

    const handleDismissAll = async () => {
        setIsDismissingAll(true);
        try {
            const response = await fetch('/api/alerts/dismiss-all', {
                method: 'POST',
            });

            if (response.ok) {
                const data = await response.json();
                // Mark all as dismissed locally
                setAlerts(prev => prev.map(a => ({ ...a, is_dismissed: true })));
                // Dispatch event to update bell
                window.dispatchEvent(new Event('alerts-updated'));
                toast.success(`${data.count} alertas aplazadas por 24 horas`);
            } else {
                toast.error('Error al aplazar alertas');
            }
        } catch {
            toast.error('Error al aplazar alertas');
        } finally {
            setIsDismissingAll(false);
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const filteredAlerts = filter === 'all'
        ? alerts
        : alerts.filter(a => a.type === filter);

    // Sort: Non-dismissed first, then dismissed
    filteredAlerts.sort((a, b) => {
        return (Number(a.is_dismissed || 0) - Number(b.is_dismissed || 0));
    });

    const alertCounts = {
        all: alerts.length,
        payment_due: alerts.filter(a => a.type === 'payment_due').length,
        invoice_reminder: alerts.filter(a => a.type === 'invoice_reminder').length,
        attention_needed: alerts.filter(a => a.type === 'attention_needed').length,
        missing_revenue: alerts.filter(a => a.type === 'missing_revenue').length,
    };

    const filterOptions = [
        { value: 'all', label: `Todas (${alertCounts.all})` },
        { value: 'payment_due', label: `${ALERT_TYPE_CONFIG.payment_due.label} (${alertCounts.payment_due})` },
        { value: 'invoice_reminder', label: `${ALERT_TYPE_CONFIG.invoice_reminder.label} (${alertCounts.invoice_reminder})` },
        { value: 'attention_needed', label: `${ALERT_TYPE_CONFIG.attention_needed.label} (${alertCounts.attention_needed})` },
        { value: 'missing_revenue', label: `${ALERT_TYPE_CONFIG.missing_revenue.label} (${alertCounts.missing_revenue})` },
    ];

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <header className="flex flex-col gap-x-4 gap-y-4 pb-4 border-b sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-display font-semibold">Alertas</h1>
                    <p className="text-body text-muted-foreground">
                        {alerts.filter(a => !a.is_dismissed).length} {alerts.filter(a => !a.is_dismissed).length === 1 ? 'acción pendiente' : 'acciones pendientes'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchAlerts}
                        disabled={isLoading}
                        className="gap-2 h-9 text-label font-medium"
                    >
                        <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
                        <span className="hidden sm:inline">Actualizar</span>
                    </Button>
                    {alerts.some(a => !a.is_dismissed) && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDismissAll}
                            disabled={isDismissingAll}
                            className="gap-2 h-9 text-label font-medium"
                        >
                            {isDismissingAll ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <BellOff className="h-3.5 w-3.5" />
                            )}
                            <span className="hidden sm:inline">Aplazar todas</span>
                            <span className="sm:hidden">Aplazar</span>
                        </Button>
                    )}
                </div>
            </header>
            {/* Filters */}
            {alerts.length > 0 && (
                <div className="overflow-x-auto">
                    <Tabs value={filter} onValueChange={(value: string) => setFilter(value as FilterType)}>
                        <TabsList className="bg-transparent border-b border-border w-max min-w-full justify-start rounded-none h-auto p-0 gap-4 sm:gap-6 flex">
                            {filterOptions.map((option) => (
                                <TabsTrigger
                                    key={option.value}
                                    value={option.value}
                                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-0 py-2 text-body text-muted-foreground data-[state=active]:text-foreground transition-all hover:text-foreground/80 whitespace-nowrap"
                                >
                                    {option.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </div>
            )}

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
                </div>
            ) : filteredAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                    <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mb-2">
                        <AlertTriangle className="h-8 w-8 text-success" />
                    </div>
                    <div>
                        <h3 className="text-display-sm font-semibold text-foreground">
                            ¡Todo al día!
                        </h3>
                        <p className="text-body text-muted-foreground max-w-sm mt-1">
                            {filter === 'all'
                                ? 'No hay acciones pendientes en este momento.'
                                : 'No hay alertas que coincidan con el filtro seleccionado.'
                            }
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {filteredAlerts.map((alert) => {
                        const config = ALERT_TYPE_CONFIG[alert.type];
                        const Icon = config.icon;
                        const isDismissed = alert.is_dismissed;
                        const isDismissingThis = isDismissing === alert.id;
                        const isExpanded = expandedIds.has(alert.id);

                        // Dim non-expanded cards when any card is expanded
                        const isDimmed = hasAnyExpanded && !isExpanded;

                        return (
                            <Card
                                key={alert.id}
                                className={cn(
                                    "hover:bg-hover-overlay transition-all duration-300",
                                    isDimmed && "opacity-40"
                                )}
                            >
                                <CardContent className="p-4">
                                    {/* Main container: vertical on mobile, horizontal on desktop */}
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                                        {/* Left section: Badge + Info */}
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 flex-1 min-w-0">

                                            {/* Top Row Mobile / First item Desktop: Badge + Expand */}
                                            <div className="flex items-center justify-between sm:contents">
                                                {/* Category Badge */}
                                                <Badge variant={config.badgeVariant} className="gap-1 shrink-0">
                                                    <Icon className="h-3 w-3" />
                                                    {config.label}
                                                </Badge>

                                                {/* Expand Button - Mobile only in this position */}
                                                <div className="sm:hidden">
                                                    <ExpandButton
                                                        isOpen={isExpanded}
                                                        onClick={() => toggleExpand(alert.id)}
                                                        className="h-8 w-8 border-none text-[rgb(var(--red))] hover:bg-transparent p-0"
                                                    />
                                                </div>
                                            </div>

                                            {/* Info Section */}
                                            <div className="flex-1 min-w-0 space-y-1">
                                                {/* Project Name */}
                                                <Link
                                                    href={alert.href}
                                                    className="font-semibold text-title sm:text-body text-foreground hover:underline underline-offset-4 transition-colors block truncate"
                                                >
                                                    {alert.subtitle || 'Proyecto sin nombre'}
                                                </Link>

                                                {/* Alert Title with Warning Icon */}
                                                <div className="flex items-center gap-2 text-[rgb(var(--red))]">
                                                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                                    <span className="text-body truncate">
                                                        {alert.title}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right section: Actions */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            {/* Expand Button - Desktop */}
                                            <div className="hidden sm:block">
                                                <ExpandButton
                                                    isOpen={isExpanded}
                                                    onClick={() => toggleExpand(alert.id)}
                                                    className="h-8 w-8 border-none text-[rgb(var(--red))] hover:bg-transparent p-0"
                                                />
                                            </div>

                                            {/* Aplazar Button */}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className={cn(
                                                    "h-9 rounded-lg text-label font-semibold transition-all border-[rgb(var(--yellow))] text-[rgb(var(--yellow))] hover:bg-[rgb(var(--yellow))]/10",
                                                    isDismissed && "bg-transparent border-[rgb(var(--separator))] text-[rgb(var(--separator))] hover:bg-transparent cursor-not-allowed"
                                                )}
                                                onClick={() => handleDismiss(alert.id)}
                                                disabled={isDismissed || isDismissingThis}
                                            >
                                                {isDismissingThis ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                                ) : (
                                                    <Clock className="h-3.5 w-3.5 mr-1.5" />
                                                )}
                                                {isDismissed ? 'Aplazada' : 'Aplazar'}
                                            </Button>

                                            {/* Resolver Button */}
                                            <Button
                                                asChild
                                                variant="outline"
                                                size="sm"
                                                className="h-9 rounded-lg text-label font-semibold transition-all border-[rgb(var(--green))] text-[rgb(var(--green))] hover:bg-[rgb(var(--green))]/10"
                                            >
                                                <Link href={alert.href}>
                                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                                    Resolver
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Expandable Problem/Solution Section */}
                                    {isExpanded && (
                                        <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="flex gap-3 p-3 rounded-xl bg-[rgb(var(--sys-bg-tertiary))]/50">
                                                <Lightbulb className="h-4 w-4 shrink-0 text-[rgb(var(--yellow))]" />
                                                <div className="flex flex-col gap-1 text-[12px] leading-relaxed text-muted-foreground">
                                                    {alert.problem && <p><span className="text-foreground/80 font-medium">Problema:</span> {alert.problem}</p>}
                                                    {alert.solution && <p><span className="text-foreground/80 font-medium">Solución:</span> {alert.solution}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
