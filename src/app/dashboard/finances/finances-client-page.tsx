'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    Wallet,
    TrendingUp,
    Users,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Calendar,
    Building2,
    MoreHorizontal,
    CreditCard,
    FileText,
    ChevronDown,
    FolderOpen,
    User,
    Download,
    Receipt,
    Banknote,
    RefreshCw,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KPICard } from '@/components/molecules/KPICard';
import { SearchBar } from '@/components/molecules/SearchBar';
import { SegmentedControl } from '@/components/molecules/SegmentedControl';
import { MonthSelect, type MonthValue } from '@/components/molecules/MonthSelect';
import { YearSelect, type YearValue } from '@/components/molecules/YearSelect';
import {
    Card,
    CardContent,
} from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { type PaymentType } from '@/lib/constants/finance';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';


import { FinanceSummaryItem, FinanceKPIs, PaymentStatus, ClientBillingItem, ClientPaymentStatus } from './page';
import { createClient } from '@/lib/supabase/client';

type FinancesClientPageProps = {
    initialData: {
        modelPayments: FinanceSummaryItem[];
        clientBilling: ClientBillingItem[];
        kpis: FinanceKPIs;
    };
};


// DS: Use semantic badge variants (§2.B.4a)
const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, {
    label: string;
    icon: React.ElementType;
    className: string;
    badgeVariant: 'warning' | 'success' | 'info' | 'neutral' | 'danger';
}> = {
    pending: {
        label: 'Pendiente',
        icon: Clock,
        className: 'text-warning',
        badgeVariant: 'warning',
    },
    paid: {
        label: 'Pagado',
        icon: CheckCircle2,
        className: 'text-success',
        badgeVariant: 'success',
    },
    partial: {
        label: 'Parcial',
        icon: AlertCircle,
        className: 'text-info',
        badgeVariant: 'info',
    },
    cancelled: {
        label: 'Cancelado',
        icon: XCircle,
        className: 'text-destructive',
        badgeVariant: 'danger',
    },
};

// Configuración para estados de pago de clientes
const CLIENT_PAYMENT_STATUS_CONFIG: Record<ClientPaymentStatus, {
    label: string;
    icon: React.ElementType;
    className: string;
    badgeVariant: 'warning' | 'success' | 'info';
}> = {
    pending: {
        label: 'Pendiente',
        icon: Clock,
        className: 'text-warning',
        badgeVariant: 'warning',
    },
    invoiced: {
        label: 'Facturado',
        icon: Receipt,
        className: 'text-info',
        badgeVariant: 'info',
    },
    paid: {
        label: 'Pagado',
        icon: CheckCircle2,
        className: 'text-success',
        badgeVariant: 'success',
    },
};

// Formatear moneda
function formatCurrency(amount: number | null, currency: string = 'GTQ'): string {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('es-GT', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}

// Formatear rango de fechas
function formatDateRange(firstDate: string, lastDate: string): string {
    try {
        const first = parseISO(firstDate);
        const last = parseISO(lastDate);

        if (firstDate === lastDate || first.getTime() === last.getTime()) {
            return format(first, "d 'de' MMM yyyy", { locale: es });
        }

        // Si están en el mismo mes
        if (first.getMonth() === last.getMonth() && first.getFullYear() === last.getFullYear()) {
            return `${format(first, 'd', { locale: es })}-${format(last, "d 'de' MMM yyyy", { locale: es })}`;
        }

        return `${format(first, "d MMM", { locale: es })} - ${format(last, "d MMM yyyy", { locale: es })}`;
    } catch {
        return '-';
    }
}

const GUATEMALA_TIME_ZONE = 'America/Guatemala';

function getCurrentMonthInGuatemala(): number {
    const monthStr = new Intl.DateTimeFormat('en-US', {
        timeZone: GUATEMALA_TIME_ZONE,
        month: 'numeric',
    }).format(new Date());

    const month = Number(monthStr);
    return month >= 1 && month <= 12 ? month : new Date().getMonth() + 1;
}

function getCurrentYearInGuatemala(): number {
    const yearStr = new Intl.DateTimeFormat('en-US', {
        timeZone: GUATEMALA_TIME_ZONE,
        year: 'numeric',
    }).format(new Date());

    const year = Number(yearStr);
    return Number.isFinite(year) ? year : new Date().getFullYear();
}

export default function FinancesClientPage({ initialData }: FinancesClientPageProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [modelPayments, setModelPayments] = useState<FinanceSummaryItem[]>(initialData.modelPayments);
    const [clientBilling, setClientBilling] = useState<ClientBillingItem[]>(initialData.clientBilling);
    const [searchQuery, setSearchQuery] = useState('');
    const [mainTab, setMainTab] = useState(() => {
        const tabParam = searchParams.get('tab');
        return tabParam === 'clients' ? 'clients' : 'models';
    }); // 'models' | 'clients'
    const [modelStatusTab, setModelStatusTab] = useState('pending');
    const [clientStatusTab, setClientStatusTab] = useState('pending');
    const [viewMode, setViewMode] = useState<'model' | 'project'>('model');

    // Date filter states
    const [selectedMonth, setSelectedMonth] = useState<MonthValue>(() => String(getCurrentMonthInGuatemala()) as MonthValue);
    const [selectedYear, setSelectedYear] = useState<YearValue>(() => String(getCurrentYearInGuatemala()) as YearValue);
    const [periodFilter, setPeriodFilter] = useState<'all' | 'q1' | 'q2'>('all'); // q1=1-15, q2=16-fin

    // Payment Type Dialog state
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [selectedPaymentItem, setSelectedPaymentItem] = useState<FinanceSummaryItem | null>(null);
    const [selectedPaymentItems, setSelectedPaymentItems] = useState<FinanceSummaryItem[]>([]); // For batch payments
    const [selectedProjectName, setSelectedProjectName] = useState<string>(''); // Project name for batch
    const [, setSelectedPaymentType] = useState<PaymentType>('cash');
    const [tradeDescription, setTradeDescription] = useState('');

    // KPIs calculados dinámicamente para feedback inmediato
    const kpis = useMemo<FinanceKPIs>(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // KPIs de Pagos a Modelos
        const pendingModelItems = modelPayments.filter(i => i.payment_status === 'pending' || i.payment_status === 'partial');
        const paidModelsThisMonth = modelPayments.filter(i =>
            i.payment_status === 'paid' &&
            i.payment_date &&
            new Date(i.payment_date) >= startOfMonth
        );

        // KPIs de Cobros a Clientes
        const pendingClientItems = clientBilling.filter(i => i.payment_status === 'pending' || i.payment_status === 'invoiced');
        const receivedThisMonth = clientBilling.filter(i =>
            i.payment_status === 'paid' &&
            i.payment_date &&
            new Date(i.payment_date) >= startOfMonth
        );

        // Margen bruto (solo cobros RECIBIDOS - pagos REALIZADOS)
        const paidClientItems = clientBilling.filter(i => i.payment_status === 'paid');
        const paidModelItems = modelPayments.filter(i => i.payment_status === 'paid');
        const totalClientRevenue = paidClientItems.reduce((acc, i) => acc + i.subtotal, 0);
        const totalModelCosts = paidModelItems.reduce((acc, i) => acc + i.total_amount, 0);

        return {
            totalPendingModels: pendingModelItems.reduce((acc, i) => acc + (i.pending_amount || 0), 0),
            totalPaidModelsThisMonth: paidModelsThisMonth.reduce((acc, i) => acc + (i.total_paid || 0), 0),
            pendingModelPayments: pendingModelItems.length,
            modelsWithPendingPayments: new Set(pendingModelItems.map(i => i.model_id)).size,
            totalPendingClients: pendingClientItems.reduce((acc, i) => acc + i.total_with_tax, 0),
            totalReceivedThisMonth: receivedThisMonth.reduce((acc, i) => acc + i.total_with_tax, 0),
            pendingClientPayments: pendingClientItems.length,
            grossMargin: totalClientRevenue - totalModelCosts,
        };
    }, [modelPayments, clientBilling]);

    const availableYears = useMemo(() => {
        const years = new Set<number>();

        for (const item of modelPayments) {
            if (!item.first_work_date) continue;
            const year = new Date(item.first_work_date).getFullYear();
            if (Number.isFinite(year)) years.add(year);
        }

        for (const item of clientBilling) {
            if (!item.created_at) continue;
            const year = new Date(item.created_at).getFullYear();
            if (Number.isFinite(year)) years.add(year);
        }

        if (selectedYear !== 'all') {
            const y = Number(selectedYear);
            if (Number.isFinite(y)) years.add(y);
        }

        years.add(getCurrentYearInGuatemala());

        return Array.from(years);
    }, [clientBilling, modelPayments, selectedYear]);

    // Month names in Spanish
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    // Get day range based on period filter
    const getDayRange = React.useCallback(() => {
        if (selectedMonth === 'all' || selectedYear === 'all') return null;

        const monthNum = Number(selectedMonth);
        const yearNum = Number(selectedYear);
        if (!Number.isFinite(monthNum) || !Number.isFinite(yearNum)) return null;

        const lastDayOfMonth = new Date(yearNum, monthNum, 0).getDate();

        if (periodFilter === 'q1') {
            return { startDay: 1, endDay: Math.min(15, lastDayOfMonth) };
        }

        if (periodFilter === 'q2') {
            return { startDay: 16, endDay: lastDayOfMonth };
        }

        return { startDay: 1, endDay: lastDayOfMonth };
    }, [periodFilter, selectedMonth, selectedYear]);

    // Filter function for date
    const isInSelectedPeriod = React.useCallback((dateStr: string | null) => {
        if (!dateStr) return false;
        try {
            const date = new Date(dateStr);
            const itemMonth = date.getMonth() + 1;
            const itemYear = date.getFullYear();
            const itemDay = date.getDate();

            if (selectedMonth !== 'all' && itemMonth !== Number(selectedMonth)) return false;
            if (selectedYear !== 'all' && itemYear !== Number(selectedYear)) return false;

            if (periodFilter === 'all') return true;

            const range = getDayRange();
            if (!range) return true;

            return itemDay >= range.startDay && itemDay <= range.endDay;
        } catch {
            return false;
        }
    }, [getDayRange, periodFilter, selectedMonth, selectedYear]);

    // Filtrar pagos a modelos
    const filteredModelPayments = useMemo(() => {
        let filtered = modelPayments;

        // Filtrar por fecha/período
        filtered = filtered.filter(i => isInSelectedPeriod(i.first_work_date));

        // Filtrar por tab de estado
        if (modelStatusTab === 'pending') {
            filtered = filtered.filter(i => i.payment_status === 'pending' || i.payment_status === 'partial');
        } else if (modelStatusTab === 'paid') {
            filtered = filtered.filter(i => i.payment_status === 'paid');
        }
        // 'all' muestra todo

        // Filtrar por búsqueda
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(item =>
                item.model_name.toLowerCase().includes(query) ||
                item.model_alias?.toLowerCase().includes(query) ||
                item.project_name.toLowerCase().includes(query) ||
                item.client_name?.toLowerCase().includes(query) ||
                item.registered_client_name?.toLowerCase().includes(query) ||
                item.brand_name?.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [isInSelectedPeriod, modelPayments, searchQuery, modelStatusTab]);

    // Filtrar cobros a clientes
    const filteredClientBilling = useMemo(() => {
        let filtered = clientBilling;

        // Filtrar por fecha/período
        filtered = filtered.filter(i => isInSelectedPeriod(i.created_at));

        // Filtrar por tab de estado
        if (clientStatusTab === 'pending') {
            filtered = filtered.filter(i => i.payment_status === 'pending');
        } else if (clientStatusTab === 'invoiced') {
            filtered = filtered.filter(i => i.payment_status === 'invoiced');
        } else if (clientStatusTab === 'paid') {
            filtered = filtered.filter(i => i.payment_status === 'paid');
        }
        // 'all' muestra todo

        // Filtrar por búsqueda
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(item =>
                item.project_name.toLowerCase().includes(query) ||
                item.client_name?.toLowerCase().includes(query) ||
                item.registered_client_name?.toLowerCase().includes(query) ||
                item.brand_name?.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [clientBilling, isInSelectedPeriod, searchQuery, clientStatusTab]);

    // Agrupar items por proyecto para la vista por proyecto
    type ProjectGroup = {
        project_id: string;
        project_name: string;
        client_name: string | null;
        brand_name: string | null;
        currency: string;
        total_pending: number;
        total_amount: number;
        total_trade_value: number;  // Total trade value
        models: FinanceSummaryItem[];
    };

    const itemsByProject = useMemo(() => {
        const groups = new Map<string, ProjectGroup>();

        filteredModelPayments.forEach(item => {
            const existing = groups.get(item.project_id);
            if (existing) {
                existing.models.push(item);
                existing.total_pending += item.pending_amount;
                existing.total_amount += item.total_amount;
                existing.total_trade_value += (item.total_trade_value ?? 0);
            } else {
                groups.set(item.project_id, {
                    project_id: item.project_id,
                    project_name: item.project_name,
                    client_name: item.registered_client_name || item.client_name,
                    brand_name: item.brand_name,
                    currency: item.currency,
                    total_pending: item.pending_amount,
                    total_amount: item.total_amount,
                    total_trade_value: item.total_trade_value ?? 0,
                    models: [item],
                });
            }
        });

        return Array.from(groups.values()).sort((a, b) => b.total_pending - a.total_pending);
    }, [filteredModelPayments]);

    // Abrir diálogo para pago individual
    const handleMarkAsPaid = (item: FinanceSummaryItem) => {
        setSelectedPaymentItem(item);
        setSelectedPaymentItems([]);
        setSelectedProjectName('');
        setSelectedPaymentType('cash');
        setTradeDescription('');
        setPaymentDialogOpen(true);
    };

    // Abrir diálogo para pago de proyecto completo (múltiples modelos)
    const handleMarkAllAsPaidForProject = (pendingModels: FinanceSummaryItem[], projectName: string) => {
        setSelectedPaymentItem(null);
        setSelectedPaymentItems(pendingModels);
        setSelectedProjectName(projectName);
        setSelectedPaymentType('cash');
        setTradeDescription('');
        setPaymentDialogOpen(true);
    };

    // Confirmar el pago (individual o múltiple)
    const confirmPayment = async () => {
        // Determine items to pay - single or batch
        const itemsToPay = selectedPaymentItem ? [selectedPaymentItem] : selectedPaymentItems;

        if (itemsToPay.length === 0) return;
        const supabase = createClient();
        let totalDaysUpdated = 0;

        for (const item of itemsToPay) {
            console.log('[confirmPayment] Procesando modelo...', {
                model_id: item.model_id,
                project_id: item.project_id,
            });

            // Paso 1: Obtener todos los schedule_ids de este proyecto
            const { data: schedules, error: scheduleError } = await supabase
                .from('project_schedule')
                .select('id')
                .eq('project_id', item.project_id);

            if (scheduleError) {
                console.error('[confirmPayment] Error al buscar schedules:', scheduleError);
                toast.error('Error al buscar fechas del proyecto');
                continue;
            }

            if (!schedules || schedules.length === 0) {
                console.warn('[confirmPayment] No schedules found for project:', item.project_id);
                continue;
            }

            const scheduleIds = schedules.map(s => s.id);

            // Paso 2: Buscar asignaciones de este modelo en estos schedules
            const { data: existingAssignments, error: fetchError } = await supabase
                .from('model_assignments')
                .select('id, schedule_id, payment_status')
                .eq('model_id', item.model_id)
                .in('schedule_id', scheduleIds);

            if (fetchError) {
                console.error('[confirmPayment] Error al buscar asignaciones:', fetchError);
                continue;
            }

            if (!existingAssignments || existingAssignments.length === 0) {
                console.warn('[confirmPayment] No assignments found for model:', item.model_id);
                continue;
            }

            // Determine payment type based on what the item has
            let paymentType: PaymentType = 'cash';
            const hasCash = (item.daily_fee ?? 0) > 0;
            const hasTrade = (item.daily_trade_fee ?? 0) > 0;
            if (hasCash && hasTrade) {
                paymentType = 'mixed';
            } else if (hasTrade && !hasCash) {
                paymentType = 'trade';
            }

            // Paso 3: Actualizar las asignaciones
            const assignmentIds = existingAssignments.map(a => a.id);

            const updatePayload: {
                payment_status: string;
                payment_date: string;
                payment_type: PaymentType;
                trade_details: string | null;
            } = {
                payment_status: 'paid',
                payment_date: new Date().toISOString(),
                payment_type: paymentType,
                trade_details: paymentType !== 'cash' ? tradeDescription || null : null,
            };

            const { error } = await supabase
                .from('model_assignments')
                .update(updatePayload)
                .in('id', assignmentIds);

            if (error) {
                console.error('[confirmPayment] Error en update:', error);
                toast.error(`Error al actualizar ${item.model_alias || item.model_name}`, {
                    description: error.message,
                });
                continue;
            }

            totalDaysUpdated += existingAssignments.length;

            // Actualizar estado local para este item
            setModelPayments(prev => prev.map(i =>
                i.id === item.id
                    ? {
                        ...i,
                        payment_status: 'paid' as PaymentStatus,
                        payment_date: new Date().toISOString(),
                        payment_type: paymentType,
                        trade_description: paymentType !== 'cash' ? tradeDescription || null : null,
                        pending_amount: 0,
                        total_paid: i.total_amount
                    }
                    : i
            ));
        }

        // Cerrar diálogo y limpiar
        setPaymentDialogOpen(false);
        setSelectedPaymentItem(null);
        setSelectedPaymentItems([]);
        setSelectedProjectName('');

        if (itemsToPay.length === 1) {
            toast.success(`Pago registrado: ${totalDaysUpdated} día(s)`);
        } else {
            toast.success(`${itemsToPay.length} pagos registrados: ${totalDaysUpdated} día(s) total`);
        }
        router.refresh();
    };

    // Marcar como cancelado - también buscamos a través de schedules
    const handleMarkAsCancelled = async (item: FinanceSummaryItem) => {
        const supabase = createClient();

        // Obtener schedule_ids del proyecto
        const { data: schedules } = await supabase
            .from('project_schedule')
            .select('id')
            .eq('project_id', item.project_id);

        if (!schedules || schedules.length === 0) {
            toast.error('No se encontraron fechas para este proyecto');
            return;
        }

        const scheduleIds = schedules.map(s => s.id);

        // Buscar asignaciones
        const { data: assignments } = await supabase
            .from('model_assignments')
            .select('id')
            .eq('model_id', item.model_id)
            .in('schedule_id', scheduleIds);

        if (!assignments || assignments.length === 0) {
            toast.error('No se encontraron asignaciones');
            return;
        }

        const assignmentIds = assignments.map(a => a.id);

        const { error } = await supabase
            .from('model_assignments')
            .update({ payment_status: 'cancelled' })
            .in('id', assignmentIds);

        if (error) {
            toast.error('Error al cancelar pago', {
                description: error.message,
            });
            return;
        }

        setModelPayments(prev => prev.map(i =>
            i.id === item.id
                ? { ...i, payment_status: 'cancelled' as PaymentStatus }
                : i
        ));

        toast.success('Pago cancelado');
        router.refresh();
    };

    // Exportar a Excel
    const handleExport = (type: 'models' | 'clients') => {
        const url = new URL('/api/finances/export', window.location.origin);
        url.searchParams.set('type', type);
        if (selectedMonth !== 'all') url.searchParams.set('month', selectedMonth);
        if (selectedYear !== 'all') url.searchParams.set('year', selectedYear);

        // Add quincena params if not 'all'
        if (periodFilter !== 'all') {
            const range = getDayRange();
            if (range) {
                url.searchParams.set('startDay', range.startDay.toString());
                url.searchParams.set('endDay', range.endDay.toString());
            }
        }

        window.open(url.toString(), '_blank');

        const range = periodFilter !== 'all' ? getDayRange() : null;
        const periodLabel = range && periodFilter === 'q1' ? ' (1–15)' : range && periodFilter === 'q2' ? ' (16–fin)' : '';
        const monthLabel = selectedMonth === 'all' ? 'Todos los meses' : monthNames[Number(selectedMonth) - 1];
        const yearLabel = selectedYear === 'all' ? 'Todos los años' : selectedYear;
        toast.success(`Descargando ${monthLabel}${periodLabel} ${yearLabel}...`);
    };

    // Actualizar estado de pago del cliente
    const handleUpdateClientPaymentStatus = async (item: ClientBillingItem, newStatus: ClientPaymentStatus) => {
        const supabase = createClient();

        const updateData: Partial<{ client_payment_status: string; client_payment_date: string | null }> = {
            client_payment_status: newStatus,
        };

        // Si se marca como pagado, guardar la fecha
        if (newStatus === 'paid') {
            updateData.client_payment_date = new Date().toISOString();
        }

        const { error } = await supabase
            .from('projects')
            .update(updateData)
            .eq('id', item.project_id);

        if (error) {
            console.error('[handleUpdateClientPaymentStatus] Error:', error);
            toast.error('Error al actualizar estado');
            return;
        }

        // Actualizar estado local
        setClientBilling(prev => prev.map(i =>
            i.project_id === item.project_id
                ? { ...i, payment_status: newStatus, payment_date: newStatus === 'paid' ? new Date().toISOString() : i.payment_date }
                : i
        ));

        const statusLabels: Record<string, string> = { pending: 'Pendiente', invoiced: 'Facturado', paid: 'Cobrado' };
        toast.success(`Estado actualizado a: ${statusLabels[newStatus]}`);
        router.refresh();
    };

    return (
        <div className="flex flex-col gap-6">
            <header className="flex flex-col gap-x-4 gap-y-4 pb-4 border-b sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-display font-semibold">Finanzas</h1>
                </div>
            </header>

            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <KPICard
                    title="Por Cobrar"
                    value={formatCurrency(kpis.totalPendingClients)}
                    description="Pendiente de clientes"
                    icon={Receipt}
                    iconClassName="text-warning"
                />
                <KPICard
                    title="Por Pagar"
                    value={formatCurrency(kpis.totalPendingModels)}
                    description="Pendiente a modelos"
                    icon={Wallet}
                    iconClassName="text-orange"
                />
                <KPICard
                    title="Margen Bruto"
                    value={formatCurrency(kpis.grossMargin)}
                    description="Cobros - Pagos"
                    icon={TrendingUp}
                    iconClassName={kpis.grossMargin >= 0 ? "text-success" : "text-destructive"}
                />
                <KPICard
                    title="Modelos Pendientes"
                    value={kpis.modelsWithPendingPayments.toString()}
                    description="Con pagos pendientes"
                    icon={Users}
                    iconClassName="text-accent"
                />
            </div>

            {/* Main Tabs: Pagos a Modelos / Cobros a Clientes */}
            <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-4">
                <div className="flex flex-col gap-x-4 gap-y-4 sm:flex-row sm:items-center sm:justify-between">
                    <TabsList className="grid w-full sm:w-auto grid-cols-2">
                        <TabsTrigger value="models" className="gap-x-2 gap-y-2">
                            <User className="h-4 w-4" />
                            Pagos a Modelos
                        </TabsTrigger>
                        <TabsTrigger value="clients" className="gap-x-2 gap-y-2">
                            <Building2 className="h-4 w-4" />
                            Cobros a Clientes
                        </TabsTrigger>
                    </TabsList>

                    <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-x-2 sm:gap-y-2">
                        {/* Month / Year */}
                        <div className="col-span-2 grid w-full grid-cols-2 gap-2 sm:w-auto sm:flex sm:items-center sm:gap-x-2 sm:gap-y-2">
                            <YearSelect
                                years={availableYears}
                                includeAll
                                value={selectedYear}
                                onValueChange={setSelectedYear}
                                placeholder="Año"
                                triggerClassName="w-full sm:w-24"
                            />
                            <MonthSelect
                                includeAll
                                value={selectedMonth}
                                onValueChange={setSelectedMonth}
                                placeholder="Mes"
                                triggerClassName="w-full sm:w-32"
                            />
                        </div>

                        {/* Period Toggle (Quincenas) */}
                        <div className="col-span-2 w-full sm:w-auto">
                            <SegmentedControl
                                ariaLabel="Periodo"
                                value={periodFilter}
                                onValueChange={setPeriodFilter}
                                mobileColumns={3}
                                options={[
                                    { value: 'all', label: 'Mes' },
                                    { value: 'q1', label: '1-15' },
                                    { value: 'q2', label: '16-fin' },
                                ]}
                            />
                        </div>

                        {/* Search */}
                        <div className="col-span-2 w-full sm:w-auto">
                            <SearchBar
                                placeholder="Buscar..."
                                value={searchQuery}
                                onValueChange={setSearchQuery}
                                className="w-full sm:w-45"
                            />
                        </div>

                        {/* Export Button */}
                        <div className="col-span-2 w-full sm:w-auto">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleExport(mainTab === 'models' ? 'models' : 'clients')}
                                className="w-full gap-x-2 gap-y-2 sm:w-auto"
                            >
                                <Download className="h-4 w-4" />
                                <span className="hidden sm:inline">Excel</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* TAB: Pagos a Modelos */}
                <TabsContent value="models" className="space-y-4 mt-0">
                    {/* Sub-tabs para estado */}
                    <div className="flex flex-col gap-x-4 gap-y-4 sm:flex-row sm:items-center sm:justify-between">
                        <SegmentedControl
                            ariaLabel="Estado de pagos a modelos"
                            value={modelStatusTab}
                            onValueChange={setModelStatusTab}
                            options={[
                                {
                                    value: 'pending',
                                    label: 'Pendientes',
                                    icon: <Clock className="h-3.5 w-3.5" />,
                                },
                                {
                                    value: 'paid',
                                    label: 'Pagados',
                                    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
                                },
                                {
                                    value: 'all',
                                    label: 'Todos',
                                    icon: <FileText className="h-3.5 w-3.5" />,
                                    mobileColSpan: 2,
                                },
                            ]}
                        />

                        {/* View Mode */}
                        <div className="flex items-center gap-x-2 gap-y-2">
                            <span className="text-label text-muted-foreground hidden sm:inline">Vista:</span>
                            <SegmentedControl
                                ariaLabel="Modo de vista"
                                value={viewMode}
                                onValueChange={setViewMode}
                                mobileColumns={2}
                                options={[
                                    {
                                        value: 'model',
                                        label: 'Modelo',
                                        icon: <User className="h-3.5 w-3.5" />,
                                    },
                                    {
                                        value: 'project',
                                        label: 'Proyecto',
                                        icon: <FolderOpen className="h-3.5 w-3.5" />,
                                    },
                                ]}
                            />
                        </div>
                    </div>

                    {/* Payment Cards */}
                    <div className="space-y-3">
                        {filteredModelPayments.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-16">
                                    <Wallet className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                    <h3 className="text-title font-medium mb-2">No hay registros</h3>
                                    <p className="text-body text-muted-foreground text-center max-w-sm">
                                        {searchQuery
                                            ? 'No se encontraron registros con ese criterio de búsqueda.'
                                            : modelStatusTab === 'pending'
                                                ? 'No hay pagos pendientes. ¡Excelente!'
                                                : 'No hay registros en esta categoría.'}
                                    </p>
                                </CardContent>
                            </Card>
                        ) : viewMode === 'model' ? (
                            filteredModelPayments.map((item) => (
                                <PaymentCard
                                    key={item.id}
                                    item={item}
                                    onMarkAsPaid={() => handleMarkAsPaid(item)}
                                    onMarkAsCancelled={() => handleMarkAsCancelled(item)}
                                />
                            ))
                        ) : (
                            itemsByProject.map((group) => (
                                <ProjectGroupCard
                                    key={group.project_id}
                                    group={group}
                                    onMarkAsPaid={handleMarkAsPaid}
                                    onMarkAllAsPaid={(pendingModels) => handleMarkAllAsPaidForProject(pendingModels, group.project_name)}
                                    onMarkAsCancelled={handleMarkAsCancelled}
                                />
                            ))
                        )}
                    </div>
                </TabsContent>

                {/* TAB: Cobros a Clientes */}
                <TabsContent value="clients" className="space-y-4 mt-0">
                    {/* Sub-tabs para estado */}
                    <SegmentedControl
                        ariaLabel="Estado de cobros a clientes"
                        value={clientStatusTab}
                        onValueChange={setClientStatusTab}
                        options={[
                            {
                                value: 'pending',
                                label: 'Pendientes',
                                icon: <Clock className="h-3.5 w-3.5" />,
                            },
                            {
                                value: 'invoiced',
                                label: 'Facturados',
                                icon: <Receipt className="h-3.5 w-3.5" />,
                            },
                            {
                                value: 'paid',
                                label: 'Cobrados',
                                icon: <CheckCircle2 className="h-3.5 w-3.5" />,
                            },
                            {
                                value: 'all',
                                label: 'Todos',
                                icon: <FileText className="h-3.5 w-3.5" />,
                            },
                        ]}
                    />

                    {/* Client Billing Cards */}
                    <div className="space-y-3">
                        {filteredClientBilling.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-16">
                                    <Receipt className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                    <h3 className="text-title font-medium mb-2">No hay registros</h3>
                                    <p className="text-body text-muted-foreground text-center max-w-sm">
                                        {searchQuery
                                            ? 'No se encontraron registros con ese criterio de búsqueda.'
                                            : clientStatusTab === 'pending'
                                                ? 'No hay cobros pendientes.'
                                                : 'No hay registros en esta categoría.'}
                                    </p>
                                    <p className="text-label text-muted-foreground mt-2">
                                        Los cobros se generan al agregar un monto de facturación en los proyectos.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            filteredClientBilling.map((item) => (
                                <ClientBillingCard
                                    key={item.project_id}
                                    item={item}
                                    onUpdateStatus={(newStatus) => handleUpdateClientPaymentStatus(item, newStatus)}
                                />
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Payment Confirmation Dialog - Handles single and batch payments */}
            <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Confirmar Pago</DialogTitle>
                        <DialogDescription asChild>
                            <div className="space-y-1">
                                {selectedPaymentItem ? (
                                    <span className="block">
                                        ¿Confirmas el pago a <strong>{selectedPaymentItem.model_alias || selectedPaymentItem.model_name}</strong>?
                                    </span>
                                ) : selectedPaymentItems.length > 0 ? (
                                    <span className="block">
                                        ¿Confirmas el pago a <strong>{selectedPaymentItems.length} modelo{selectedPaymentItems.length !== 1 ? 's' : ''}</strong> del proyecto <strong>{selectedProjectName}</strong>?
                                    </span>
                                ) : null}
                            </div>
                        </DialogDescription>
                    </DialogHeader>

                    {/* Single payment view */}
                    {selectedPaymentItem && (
                        <div className="py-4 space-y-4">
                            <div className="flex flex-col gap-3">
                                {(selectedPaymentItem.daily_fee ?? 0) > 0 && (
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-quaternary">
                                        <div className="w-10 h-10 rounded-full border-2 border-success bg-success/20 flex items-center justify-center shrink-0">
                                            <Banknote className="w-5 h-5 text-success" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-body font-medium text-foreground">Efectivo</p>
                                            <p className="text-label text-muted-foreground">
                                                {selectedPaymentItem.days_worked} {selectedPaymentItem.days_worked === 1 ? 'día' : 'días'} × {formatCurrency(selectedPaymentItem.daily_fee, selectedPaymentItem.currency)}/día
                                            </p>
                                        </div>
                                        <span className="text-title font-bold text-foreground">
                                            {formatCurrency(selectedPaymentItem.total_amount, selectedPaymentItem.currency)}
                                        </span>
                                    </div>
                                )}
                                {(selectedPaymentItem.daily_trade_fee ?? 0) > 0 && (
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-quaternary">
                                        <div className="w-10 h-10 rounded-full border-2 border-blue bg-blue/20 flex items-center justify-center shrink-0">
                                            <RefreshCw className="w-5 h-5 text-blue" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-body font-medium text-foreground">Canje</p>
                                            <p className="text-label text-muted-foreground">
                                                {selectedPaymentItem.days_worked} {selectedPaymentItem.days_worked === 1 ? 'día' : 'días'} × {formatCurrency(selectedPaymentItem.daily_trade_fee, selectedPaymentItem.currency)}/día
                                            </p>
                                        </div>
                                        <span className="text-title font-bold text-foreground">
                                            {formatCurrency(selectedPaymentItem.total_trade_value || 0, selectedPaymentItem.currency)}
                                        </span>
                                    </div>
                                )}
                                {(selectedPaymentItem.daily_fee ?? 0) === 0 && (selectedPaymentItem.daily_trade_fee ?? 0) === 0 && (
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-quaternary">
                                        <div className="w-10 h-10 rounded-full border-2 border-muted bg-muted/20 flex items-center justify-center shrink-0">
                                            <AlertCircle className="w-5 h-5 text-muted-foreground" />
                                        </div>
                                        <p className="text-body text-muted-foreground">
                                            Sin monto definido para este pago
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-label text-muted-foreground">
                                <Building2 className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{selectedPaymentItem.project_name}</span>
                            </div>
                        </div>
                    )}

                    {/* Batch payment view - multiple models */}
                    {selectedPaymentItems.length > 0 && (
                        <div className="py-4 space-y-4">
                            {/* List of models to pay */}
                            <div className="flex flex-col gap-2">
                                {selectedPaymentItems.map((item) => {
                                    const hasCash = (item.daily_fee ?? 0) > 0;
                                    const hasTrade = (item.daily_trade_fee ?? 0) > 0;
                                    return (
                                        <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-quaternary">
                                            <User className="w-5 h-5 text-muted-foreground shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-body font-medium text-foreground truncate">
                                                    {item.model_alias || item.model_name}
                                                </p>
                                                <p className="text-label text-muted-foreground">
                                                    {item.days_worked} {item.days_worked === 1 ? 'día' : 'días'}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                {hasCash && (
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-5 h-5 rounded-full border border-success bg-success/20 flex items-center justify-center">
                                                            <Banknote className="w-3 h-3 text-success" />
                                                        </div>
                                                        <span className="text-body font-medium text-foreground">
                                                            {formatCurrency(item.total_amount, item.currency)}
                                                        </span>
                                                    </div>
                                                )}
                                                {hasTrade && (
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-5 h-5 rounded-full border border-blue bg-blue/20 flex items-center justify-center">
                                                            <RefreshCw className="w-3 h-3 text-blue" />
                                                        </div>
                                                        <span className="text-body font-medium text-foreground">
                                                            {formatCurrency(item.total_trade_value || 0, item.currency)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Totals summary */}
                            <Separator />
                            <div className="flex flex-col gap-2">
                                {(() => {
                                    const totalCash = selectedPaymentItems.reduce((sum, i) => sum + (i.total_amount || 0), 0);
                                    const totalTrade = selectedPaymentItems.reduce((sum, i) => sum + (i.total_trade_value || 0), 0);
                                    const currency = selectedPaymentItems[0]?.currency || 'GTQ';
                                    return (
                                        <>
                                            {totalCash > 0 && (
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full border-2 border-success bg-success/20 flex items-center justify-center">
                                                            <Banknote className="w-3.5 h-3.5 text-success" />
                                                        </div>
                                                        <span className="text-body text-muted-foreground">Total Efectivo</span>
                                                    </div>
                                                    <span className="text-title font-bold text-foreground">
                                                        {formatCurrency(totalCash, currency)}
                                                    </span>
                                                </div>
                                            )}
                                            {totalTrade > 0 && (
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full border-2 border-blue bg-blue/20 flex items-center justify-center">
                                                            <RefreshCw className="w-3.5 h-3.5 text-blue" />
                                                        </div>
                                                        <span className="text-body text-muted-foreground">Total Canje</span>
                                                    </div>
                                                    <span className="text-title font-bold text-foreground">
                                                        {formatCurrency(totalTrade, currency)}
                                                    </span>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setPaymentDialogOpen(false)}
                            className="border-separator bg-transparent hover:bg-hover-overlay"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={confirmPayment}
                            className="gap-2 bg-[rgb(var(--purple))] hover:bg-[rgb(var(--purple))]/90 text-white"
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            {selectedPaymentItems.length > 1
                                ? `Confirmar ${selectedPaymentItems.length} Pagos`
                                : 'Confirmar Pago'
                            }
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Nuevo componente de tarjeta de pago - Diseño unificado responsive
function PaymentCard({
    item,
    onMarkAsPaid,
    onMarkAsCancelled,
}: {
    item: FinanceSummaryItem;
    onMarkAsPaid: () => void;
    onMarkAsCancelled: () => void;
}) {
    const status = item.payment_status || 'pending';
    const statusConfig = PAYMENT_STATUS_CONFIG[status];
    const StatusIcon = statusConfig.icon;

    const clientDisplay = item.brand_name || item.registered_client_name || item.client_name || '-';
    const modelDisplay = item.model_alias || item.model_name;
    const daysText = item.days_worked === 1 ? '1 día' : `${item.days_worked} días`;

    // Build breakdown text based on payment type
    const hasCash = (item.daily_fee ?? 0) > 0;
    const hasTrade = (item.daily_trade_fee ?? 0) > 0;

    let breakdownText = daysText;
    if (hasCash) {
        breakdownText += ` × ${formatCurrency(item.daily_fee || 0, item.currency)}/día`;
    }

    const isPending = status === 'pending' || status === 'partial';

    return (
        <Card className="hover:bg-hover-overlay transition-colors">
            <CardContent className="p-4">
                {/* Main container: vertical on mobile, horizontal on desktop */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    {/* Left section: Badge + Info */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 flex-1 min-w-0">

                        {/* Top Row Mobile / First item Desktop: Status Badge + Options */}
                        <div className="flex items-center justify-between sm:contents">
                            {/* Status Badge */}
                            {isPending ? (
                                <Badge variant="warning" className="text-label shrink-0">
                                    Pendiente
                                </Badge>
                            ) : (
                                <Badge variant={statusConfig.badgeVariant} className="gap-1 shrink-0">
                                    <StatusIcon className={`h-3 w-3 ${statusConfig.className}`} />
                                    {statusConfig.label}
                                </Badge>
                            )}

                            {/* Options Menu - Mobile only in this position */}
                            <div className="sm:hidden">
                                {isPending && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-card hover:bg-card/80 border border-border">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={onMarkAsPaid}>
                                                <CheckCircle2 className="mr-2 h-4 w-4 text-success" />
                                                Marcar como Pagado
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                                <CreditCard className="mr-2 h-4 w-4" />
                                                Registrar Pago Parcial
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={onMarkAsCancelled}
                                                className="text-destructive focus:text-destructive"
                                            >
                                                <XCircle className="mr-2 h-4 w-4" />
                                                Cancelar Pago
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        </div>

                        {/* Info Section */}
                        <div className="flex-1 min-w-0 space-y-1">
                            {/* Model Name */}
                            <h3 className="font-semibold text-title sm:text-body text-foreground truncate">
                                {modelDisplay}
                            </h3>

                            {/* Project + Client */}
                            <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2 text-body text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 sm:h-3 sm:w-3 shrink-0" />
                                    <Link
                                        href={`/dashboard/projects/${item.project_id}`}
                                        className="hover:text-foreground hover:underline transition-colors truncate"
                                    >
                                        {item.project_name}
                                    </Link>
                                </div>
                                <span className="hidden sm:inline">•</span>
                                <div className="flex items-center gap-2 sm:gap-1">
                                    <Building2 className="h-4 w-4 sm:h-3 sm:w-3 shrink-0" />
                                    <span className="truncate">{clientDisplay}</span>
                                </div>
                            </div>

                            {/* Date Range */}
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3 text-label text-muted-foreground">
                                <div className="flex items-center gap-2 sm:gap-1">
                                    <Calendar className="h-4 w-4 sm:h-3 sm:w-3 shrink-0" />
                                    <span>{formatDateRange(item.first_work_date, item.last_work_date)}</span>
                                </div>
                                <span className="ml-6 sm:ml-0 text-foreground/70">({breakdownText})</span>
                            </div>
                        </div>
                    </div>

                    {/* Right section: Amounts + Actions */}
                    <div className="flex items-end justify-between sm:items-center sm:gap-4 sm:shrink-0">

                        {/* Amounts with circular icons */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                            {hasCash && (
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full border-2 border-success bg-success/20 flex items-center justify-center">
                                        <Banknote className="w-4 h-4 text-success" />
                                    </div>
                                    <span className="text-body font-medium text-foreground">
                                        {formatCurrency(item.total_amount, item.currency)}
                                    </span>
                                </div>
                            )}
                            {hasTrade && (
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full border-2 border-blue bg-blue/20 flex items-center justify-center">
                                        <RefreshCw className="w-4 h-4 text-blue" />
                                    </div>
                                    <span className="text-body font-medium text-foreground">
                                        {formatCurrency(item.total_trade_value || 0, item.currency)}
                                    </span>
                                </div>
                            )}
                            {!hasCash && !hasTrade && (
                                <span className="text-body font-medium text-foreground">
                                    {formatCurrency(item.total_amount, item.currency)}
                                </span>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            {/* Pay Button */}
                            {isPending && (
                                <Button
                                    size="sm"
                                    onClick={onMarkAsPaid}
                                    className="gap-x-1.5 text-label bg-transparent hover:bg-hover-overlay text-foreground border border-separator"
                                >
                                    Pagar Todo
                                </Button>
                            )}

                            {/* Paid Date */}
                            {status === 'paid' && item.payment_date && (
                                <span className="text-label text-muted-foreground">
                                    {format(parseISO(item.payment_date), "d MMM yyyy", { locale: es })}
                                </span>
                            )}

                            {/* Options Menu - Desktop */}
                            <div className="hidden sm:block">
                                {isPending && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={onMarkAsPaid}>
                                                <CheckCircle2 className="mr-2 h-4 w-4 text-success" />
                                                Marcar como Pagado
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                                <CreditCard className="mr-2 h-4 w-4" />
                                                Registrar Pago Parcial
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={onMarkAsCancelled}
                                                className="text-destructive focus:text-destructive"
                                            >
                                                <XCircle className="mr-2 h-4 w-4" />
                                                Cancelar Pago
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Componente para agrupar por proyecto
function ProjectGroupCard({
    group,
    onMarkAsPaid,
    onMarkAllAsPaid,
    onMarkAsCancelled,
}: {
    group: {
        project_id: string;
        project_name: string;
        client_name: string | null;
        brand_name: string | null;
        currency: string;
        total_pending: number;
        total_amount: number;
        total_trade_value: number;
        models: FinanceSummaryItem[];
    };
    onMarkAsPaid: (item: FinanceSummaryItem) => void;
    onMarkAllAsPaid: (pendingModels: FinanceSummaryItem[]) => void;
    onMarkAsCancelled: (item: FinanceSummaryItem) => void;
}) {
    const [isOpen, setIsOpen] = React.useState(false);
    const clientDisplay = group.brand_name || group.client_name || '-';
    const pendingModels = group.models.filter(m => m.payment_status === 'pending' || m.payment_status === 'partial');
    const hasPendingPayments = pendingModels.length > 0;

    const handleMarkAllAsPaid = () => {
        onMarkAllAsPaid(pendingModels);
    };

    return (
        <Card className="hover:bg-hover-overlay transition-colors">
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CardContent className="p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        {/* Mobile Top Row: Badge + Chevron (Desktop: Badge + Info start) */}
                        <div className="flex items-center justify-between w-full sm:w-auto sm:justify-start sm:items-center sm:gap-4 sm:flex-1 sm:min-w-0">
                            {/* Pending badge */}
                            {hasPendingPayments ? (
                                <Badge variant="warning" className="shrink-0 text-label gap-x-1">
                                    {pendingModels.length} Pendiente{pendingModels.length !== 1 && 's'}
                                </Badge>
                            ) : (
                                <div className="sm:hidden" /> /* Spacer for mobile layout consistency */
                            )}

                            {/* Mobile Chevron */}
                            <CollapsibleTrigger asChild className="sm:hidden">
                                <Button variant="secondary" size="icon" className="h-8 w-8 ml-auto rounded-full bg-card hover:bg-card/80 border border-border">
                                    <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
                                </Button>
                            </CollapsibleTrigger>

                            {/* Desktop Info */}
                            <div className="hidden sm:block flex-1 min-w-0">
                                <div className="flex items-center gap-x-2">
                                    <h3 className="font-semibold text-body truncate">{group.project_name}</h3>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-label text-muted-foreground">
                                    <div className="flex items-center gap-x-1">
                                        <Building2 className="h-3 w-3 shrink-0" />
                                        <span className="truncate">{clientDisplay}</span>
                                    </div>
                                    <span>•</span>
                                    <div className="flex items-center gap-x-1">
                                        <Users className="h-3 w-3 shrink-0" />
                                        <span>{group.models.length} {group.models.length === 1 ? 'modelo' : 'modelos'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Info Row */}
                        <div className="sm:hidden w-full">
                            <div className="flex items-center gap-x-2 mb-1">
                                <h3 className="font-semibold text-body truncate">{group.project_name}</h3>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-label text-muted-foreground">
                                <div className="flex items-center gap-x-1">
                                    <Building2 className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{clientDisplay}</span>
                                </div>
                                <div className="flex items-center gap-x-1">
                                    <Users className="h-3 w-3 shrink-0" />
                                    <span>{group.models.length} {group.models.length === 1 ? 'modelo' : 'modelos'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Bottom/Right Section: Amounts + Actions */}
                        <div className="flex items-end justify-between w-full sm:w-auto sm:items-center sm:justify-end sm:gap-6">
                            {/* Amount display */}
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                                {/* Cash amount - green */}
                                {group.total_amount > 0 && (
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full border-2 border-success bg-success/20 flex items-center justify-center">
                                            <Banknote className="w-4 h-4 text-success" />
                                        </div>
                                        <span className="text-body font-medium text-foreground">
                                            {formatCurrency(group.total_amount, group.currency)}
                                        </span>
                                    </div>
                                )}
                                {/* Trade amount - blue */}
                                {group.total_trade_value > 0 && (
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full border-2 border-blue bg-blue/20 flex items-center justify-center">
                                            <RefreshCw className="w-4 h-4 text-blue" />
                                        </div>
                                        <span className="text-body font-medium text-foreground">
                                            {formatCurrency(group.total_trade_value, group.currency)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                {hasPendingPayments && (
                                    <Button
                                        size="sm"
                                        onClick={handleMarkAllAsPaid}
                                        className="gap-x-1.5 text-label bg-transparent hover:bg-hover-overlay text-foreground border border-separator"
                                    >
                                        Pagar Todo
                                    </Button>
                                )}

                                {/* Desktop Chevron */}
                                <CollapsibleTrigger asChild className="hidden sm:inline-flex">
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
                                    </Button>
                                </CollapsibleTrigger>
                            </div>
                        </div>
                    </div>

                    {/* Collapsible Model List */}
                    <CollapsibleContent>
                        <Separator className="my-4" />
                        <div className="space-y-2 ml-6">
                            {group.models.map((model) => {
                                const status = model.payment_status || 'pending';
                                const statusConfig = PAYMENT_STATUS_CONFIG[status];
                                const StatusIcon = statusConfig.icon;
                                const modelDisplay = model.model_alias || model.model_name;
                                const daysText = model.days_worked === 1 ? '1 día' : `${model.days_worked} días`;

                                // Check for cash vs trade
                                const hasCash = (model.daily_fee ?? 0) > 0;
                                const hasTrade = (model.daily_trade_fee ?? 0) > 0;

                                return (
                                    <div
                                        key={model.id}
                                        className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between py-2 px-3 rounded-lg bg-quaternary"
                                    >
                                        <div className="flex items-center gap-x-3 gap-y-3 min-w-0">
                                            <User className="h-4 w-4 text-muted-foreground shrink-0" />
                                            <div className="min-w-0">
                                                <div className="font-medium truncate">{modelDisplay}</div>
                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-label text-muted-foreground">
                                                    <span>{daysText}</span>
                                                    {hasCash && <span>× {formatCurrency(model.daily_fee, model.currency)}/día</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                                            {/* Cash badge */}
                                            {hasCash && (
                                                <Badge variant="success" size="small" className="gap-1">
                                                    <Banknote className="h-3 w-3" />
                                                    {formatCurrency(model.total_amount, model.currency)}
                                                </Badge>
                                            )}
                                            {/* Trade badge */}
                                            {hasTrade && (
                                                <Badge variant="blue" size="small" className="gap-1">
                                                    <RefreshCw className="h-3 w-3" />
                                                    {formatCurrency(model.total_trade_value || 0, model.currency)}
                                                </Badge>
                                            )}
                                            {/* Fallback if no fee defined */}
                                            {!hasCash && !hasTrade && (
                                                <span className="text-muted-foreground text-label">Sin tarifa</span>
                                            )}
                                            <Badge variant={statusConfig.badgeVariant} className="gap-x-1 gap-y-1 text-label">
                                                <StatusIcon className={`h-3 w-3 ${statusConfig.className}`} />
                                                {statusConfig.label}
                                            </Badge>
                                            {status === 'paid' && model.payment_date && (
                                                <span className="text-label text-muted-foreground">
                                                    {format(parseISO(model.payment_date), "d MMM", { locale: es })}
                                                </span>
                                            )}
                                            {(status === 'pending' || status === 'partial') && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => onMarkAsPaid(model)}>
                                                            <CheckCircle2 className="mr-2 h-4 w-4 text-success" />
                                                            Marcar como Pagado
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => onMarkAsCancelled(model)}
                                                            className="text-destructive focus:text-destructive"
                                                        >
                                                            <XCircle className="mr-2 h-4 w-4" />
                                                            Cancelar Pago
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CollapsibleContent>
                </CardContent>
            </Collapsible>
        </Card>
    );
}

// Componente para mostrar cobros a clientes - Diseño unificado responsive
function ClientBillingCard({
    item,
    onUpdateStatus,
}: {
    item: ClientBillingItem;
    onUpdateStatus: (newStatus: ClientPaymentStatus) => void;
}) {
    const statusConfig = CLIENT_PAYMENT_STATUS_CONFIG[item.payment_status];
    const StatusIcon = statusConfig.icon;

    const clientDisplay = item.registered_client_name || item.client_name || 'Sin cliente';
    const isPending = item.payment_status === 'pending';
    const hasCash = (item.subtotal ?? 0) > 0;
    const hasTrade = (item.trade_value ?? 0) > 0;

    return (
        <Card className="hover:bg-hover-overlay transition-colors">
            <CardContent className="p-4">
                {/* Main container: vertical on mobile, horizontal on desktop */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    {/* Left section: Badge + Info */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 flex-1 min-w-0">

                        {/* Top Row Mobile / First item Desktop: Status Badge + Options */}
                        <div className="flex items-center justify-between sm:contents">
                            {/* Status Badge */}
                            <Badge variant={statusConfig.badgeVariant} className="gap-1 shrink-0">
                                <StatusIcon className={`h-3 w-3 ${statusConfig.className}`} />
                                {statusConfig.label}
                            </Badge>

                            {/* Options Menu - Mobile only in this position */}
                            <div className="sm:hidden">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-card hover:bg-card/80 border border-border">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {item.payment_status !== 'pending' && (
                                            <DropdownMenuItem onClick={() => onUpdateStatus('pending')}>
                                                <Clock className="mr-2 h-4 w-4 text-warning" />
                                                Marcar Pendiente
                                            </DropdownMenuItem>
                                        )}
                                        {item.payment_status !== 'invoiced' && (
                                            <DropdownMenuItem onClick={() => onUpdateStatus('invoiced')}>
                                                <Receipt className="mr-2 h-4 w-4 text-info" />
                                                Marcar Facturado
                                            </DropdownMenuItem>
                                        )}
                                        {item.payment_status !== 'paid' && (
                                            <DropdownMenuItem onClick={() => onUpdateStatus('paid')}>
                                                <CheckCircle2 className="mr-2 h-4 w-4 text-success" />
                                                Marcar Cobrado
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* Info Section */}
                        <div className="flex-1 min-w-0 space-y-1">
                            {/* Project Icon + Name */}
                            <div className="flex items-start gap-2">
                                <FolderOpen className="h-5 w-5 sm:h-4 sm:w-4 text-muted-foreground shrink-0 mt-0.5 sm:mt-0" />
                                <Link
                                    href={`/dashboard/projects/${item.project_id}`}
                                    className="font-semibold text-title sm:text-body text-foreground hover:text-primary hover:underline transition-colors"
                                >
                                    {item.project_name}
                                </Link>
                            </div>

                            {/* Client + Brand */}
                            <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2 text-body text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 sm:h-3 sm:w-3 shrink-0" />
                                    <span className="truncate">{clientDisplay}</span>
                                </div>
                                {item.brand_name && (
                                    <>
                                        <span className="hidden sm:inline">•</span>
                                        <div className="flex items-center gap-2 sm:gap-1">
                                            <Building2 className="h-4 w-4 sm:h-3 sm:w-3 shrink-0" />
                                            <span className="truncate">{item.brand_name}</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Invoice info - desktop only inline */}
                            {item.invoice_number && (
                                <div className="flex items-center gap-2 sm:gap-1 text-label text-muted-foreground">
                                    <Receipt className="h-4 w-4 sm:h-3 sm:w-3 shrink-0" />
                                    <span>Factura #{item.invoice_number}</span>
                                    {item.invoice_date && (
                                        <span className="hidden sm:inline">({format(parseISO(item.invoice_date), "d MMM yyyy", { locale: es })})</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right section: Amounts + Actions */}
                    <div className="flex items-end justify-between sm:items-center sm:gap-4 sm:shrink-0">

                        {/* Amounts with circular icons */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                            {hasCash && (
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full border-2 border-success bg-success/20 flex items-center justify-center">
                                        <Banknote className="w-4 h-4 text-success" />
                                    </div>
                                    <span className="text-body font-medium text-foreground">
                                        {formatCurrency(item.total_with_tax, item.currency)}
                                    </span>
                                </div>
                            )}
                            {hasTrade && (
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full border-2 border-blue bg-blue/20 flex items-center justify-center">
                                        <RefreshCw className="w-4 h-4 text-blue" />
                                    </div>
                                    <span className="text-body font-medium text-foreground">
                                        {formatCurrency(item.trade_value, item.currency)}
                                    </span>
                                </div>
                            )}
                            {!hasCash && !hasTrade && (
                                <span className="text-body text-muted-foreground">
                                    Sin monto definido
                                </span>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            {/* Paid Date */}
                            {item.payment_status === 'paid' && item.payment_date && (
                                <span className="text-label text-muted-foreground">
                                    {format(parseISO(item.payment_date), "d MMM yyyy", { locale: es })}
                                </span>
                            )}

                            {/* Options Menu - Desktop */}
                            <div className="hidden sm:block">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                            onClick={() => onUpdateStatus('pending')}
                                            disabled={item.payment_status === 'pending'}
                                        >
                                            <Clock className="mr-2 h-4 w-4 text-warning" />
                                            Pendiente
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => onUpdateStatus('invoiced')}
                                            disabled={item.payment_status === 'invoiced'}
                                        >
                                            <Receipt className="mr-2 h-4 w-4 text-info" />
                                            Facturado
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => onUpdateStatus('paid')}
                                            disabled={item.payment_status === 'paid'}
                                        >
                                            <CheckCircle2 className="mr-2 h-4 w-4 text-success" />
                                            Cobrado
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
