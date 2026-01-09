'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Wallet,
    TrendingUp,
    Users,
    Clock,
    Search,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Calendar,
    Building2,
    MoreHorizontal,
    CreditCard,
    FileText,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    FolderOpen,
    User,
    Download,
    Receipt,
    DollarSign,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
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
    badgeVariant: 'warning' | 'success' | 'info' | 'neutral';
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
        className: 'text-muted-foreground',
        badgeVariant: 'neutral',
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

export default function FinancesClientPage({ initialData }: FinancesClientPageProps) {
    const router = useRouter();
    const [modelPayments, setModelPayments] = useState<FinanceSummaryItem[]>(initialData.modelPayments);
    const [clientBilling, setClientBilling] = useState<ClientBillingItem[]>(initialData.clientBilling);
    const [kpis, _setKpis] = useState<FinanceKPIs>(initialData.kpis);
    const [searchQuery, setSearchQuery] = useState('');
    const [mainTab, setMainTab] = useState('models'); // 'models' | 'clients'
    const [modelStatusTab, setModelStatusTab] = useState('pending');
    const [clientStatusTab, setClientStatusTab] = useState('pending');
    const [viewMode, setViewMode] = useState<'model' | 'project'>('model');

    // Date filter states
    const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1); // 1-12
    const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
    const [periodFilter, setPeriodFilter] = useState<'all' | 'q1' | 'q2'>('all'); // q1=1-15, q2=16-31

    // Month names in Spanish
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    // Navigation handlers
    const goToPreviousMonth = () => {
        if (selectedMonth === 1) {
            setSelectedMonth(12);
            setSelectedYear(prev => prev - 1);
        } else {
            setSelectedMonth(prev => prev - 1);
        }
    };

    const goToNextMonth = () => {
        if (selectedMonth === 12) {
            setSelectedMonth(1);
            setSelectedYear(prev => prev + 1);
        } else {
            setSelectedMonth(prev => prev + 1);
        }
    };

    // Get day range based on period filter
    const getDayRange = () => {
        if (periodFilter === 'q1') return { startDay: 1, endDay: 15 };
        if (periodFilter === 'q2') return { startDay: 16, endDay: 31 };
        return { startDay: 1, endDay: 31 };
    };

    // Filter function for date
    const isInSelectedPeriod = (dateStr: string | null) => {
        if (!dateStr) return false;
        try {
            const date = new Date(dateStr);
            const itemMonth = date.getMonth() + 1;
            const itemYear = date.getFullYear();
            const itemDay = date.getDate();

            if (itemMonth !== selectedMonth || itemYear !== selectedYear) return false;

            const { startDay, endDay } = getDayRange();
            return itemDay >= startDay && itemDay <= endDay;
        } catch {
            return false;
        }
    };

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
    }, [modelPayments, searchQuery, modelStatusTab, selectedMonth, selectedYear, periodFilter]);

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
    }, [clientBilling, searchQuery, clientStatusTab, selectedMonth, selectedYear, periodFilter]);

    // Agrupar items por proyecto para la vista por proyecto
    type ProjectGroup = {
        project_id: string;
        project_name: string;
        client_name: string | null;
        brand_name: string | null;
        currency: string;
        total_pending: number;
        total_amount: number;
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
            } else {
                groups.set(item.project_id, {
                    project_id: item.project_id,
                    project_name: item.project_name,
                    client_name: item.registered_client_name || item.client_name,
                    brand_name: item.brand_name,
                    currency: item.currency,
                    total_pending: item.pending_amount,
                    total_amount: item.total_amount,
                    models: [item],
                });
            }
        });

        return Array.from(groups.values()).sort((a, b) => b.total_pending - a.total_pending);
    }, [filteredModelPayments]);

    // Marcar como pagado - buscamos asignaciones a través del schedule ya que project_id puede estar NULL
    const handleMarkAsPaid = async (item: FinanceSummaryItem) => {
        console.log('[handleMarkAsPaid] Iniciando...', {
            model_id: item.model_id,
            project_id: item.project_id,
            model_name: item.model_name,
            project_name: item.project_name,
        });

        const supabase = createClient();

        // Paso 1: Obtener todos los schedule_ids de este proyecto
        const { data: schedules, error: scheduleError } = await supabase
            .from('project_schedule')
            .select('id')
            .eq('project_id', item.project_id);

        console.log('[handleMarkAsPaid] Schedules del proyecto:', schedules);
        if (scheduleError) {
            console.error('[handleMarkAsPaid] Error al buscar schedules:', scheduleError);
            toast.error('Error al buscar fechas del proyecto');
            return;
        }

        if (!schedules || schedules.length === 0) {
            console.error('[handleMarkAsPaid] No se encontraron schedules para el proyecto');
            toast.error('No se encontraron fechas para este proyecto');
            return;
        }

        const scheduleIds = schedules.map(s => s.id);
        console.log('[handleMarkAsPaid] Schedule IDs:', scheduleIds);

        // Paso 2: Buscar asignaciones de este modelo en estos schedules
        const { data: existingAssignments, error: fetchError } = await supabase
            .from('model_assignments')
            .select('id, schedule_id, payment_status')
            .eq('model_id', item.model_id)
            .in('schedule_id', scheduleIds);

        console.log('[handleMarkAsPaid] Asignaciones encontradas:', existingAssignments);
        if (fetchError) {
            console.error('[handleMarkAsPaid] Error al buscar asignaciones:', fetchError);
        }

        if (!existingAssignments || existingAssignments.length === 0) {
            console.error('[handleMarkAsPaid] No se encontraron asignaciones');
            toast.error('No se encontraron asignaciones para actualizar');
            return;
        }

        // Paso 3: Actualizar las asignaciones encontradas
        const assignmentIds = existingAssignments.map(a => a.id);
        console.log('[handleMarkAsPaid] Assignment IDs a actualizar:', assignmentIds);

        const { data: updateData, error } = await supabase
            .from('model_assignments')
            .update({
                payment_status: 'paid',
                payment_date: new Date().toISOString(),
            })
            .in('id', assignmentIds)
            .select();

        console.log('[handleMarkAsPaid] Resultado del update:', { updateData, error });

        if (error) {
            console.error('[handleMarkAsPaid] Error en update:', error);
            toast.error('Error al actualizar estado', {
                description: error.message,
            });
            return;
        }

        // Actualizar estado local
        setModelPayments(prev => prev.map(i =>
            i.id === item.id
                ? { ...i, payment_status: 'paid' as PaymentStatus, payment_date: new Date().toISOString(), pending_amount: 0, total_paid: i.total_amount }
                : i
        ));

        toast.success(`Pago registrado: ${existingAssignments.length} día(s) marcados como pagados`);
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
        url.searchParams.set('month', selectedMonth.toString());
        url.searchParams.set('year', selectedYear.toString());

        // Add quincena params if not 'all'
        if (periodFilter !== 'all') {
            const { startDay, endDay } = getDayRange();
            url.searchParams.set('startDay', startDay.toString());
            url.searchParams.set('endDay', endDay.toString());
        }

        window.open(url.toString(), '_blank');
        const periodLabel = periodFilter === 'q1' ? ' Q1' : periodFilter === 'q2' ? ' Q2' : '';
        toast.success(`Descargando ${monthNames[selectedMonth - 1]}${periodLabel} ${selectedYear}...`);
    };

    return (
        <div className="flex flex-col gap-6 p-6 md:p-8">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-heading-28 font-semibold">Finanzas</h1>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KPICard
                    title="Por Cobrar"
                    value={formatCurrency(kpis.totalPendingClients)}
                    description="Pendiente de clientes"
                    icon={Receipt}
                    iconClassName="text-blue-600 dark:text-blue-400"
                />
                <KPICard
                    title="Por Pagar"
                    value={formatCurrency(kpis.totalPendingModels)}
                    description="Pendiente a modelos"
                    icon={Wallet}
                    iconClassName="text-yellow-600 dark:text-yellow-400"
                />
                <KPICard
                    title="Margen Bruto"
                    value={formatCurrency(kpis.grossMargin)}
                    description="Cobros - Pagos"
                    icon={TrendingUp}
                    iconClassName={kpis.grossMargin >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}
                />
                <KPICard
                    title="Modelos Pendientes"
                    value={kpis.modelsWithPendingPayments.toString()}
                    description="Con pagos pendientes"
                    icon={Users}
                    iconClassName="text-purple-600 dark:text-purple-400"
                />
            </div>

            {/* Main Tabs: Pagos a Modelos / Cobros a Clientes */}
            <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <TabsList className="grid w-full sm:w-auto grid-cols-2">
                        <TabsTrigger value="models" className="gap-2">
                            <User className="h-4 w-4" />
                            Pagos a Modelos
                        </TabsTrigger>
                        <TabsTrigger value="clients" className="gap-2">
                            <Building2 className="h-4 w-4" />
                            Cobros a Clientes
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Month Navigation */}
                        <div className="flex items-center gap-1 rounded-lg border bg-background p-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={goToPreviousMonth}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center gap-1 px-2 min-w-[110px] justify-center">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-copy-12 font-medium">
                                    {monthNames[selectedMonth - 1]} {selectedYear}
                                </span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={goToNextMonth}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Period Toggle (Quincenas) */}
                        <div className="flex items-center rounded-lg border bg-background p-1 gap-0.5">
                            <Button
                                variant={periodFilter === 'q1' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setPeriodFilter('q1')}
                                className="h-7 text-xs px-2"
                            >
                                Q1 (1-15)
                            </Button>
                            <Button
                                variant={periodFilter === 'q2' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setPeriodFilter('q2')}
                                className="h-7 text-xs px-2"
                            >
                                Q2 (16-31)
                            </Button>
                            <Button
                                variant={periodFilter === 'all' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setPeriodFilter('all')}
                                className="h-7 text-xs px-2"
                            >
                                Mes
                            </Button>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Buscar..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 w-[150px] sm:w-[180px]"
                            />
                        </div>

                        {/* Export Button */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExport(mainTab === 'models' ? 'models' : 'clients')}
                            className="gap-2"
                        >
                            <Download className="h-4 w-4" />
                            <span className="hidden sm:inline">Excel</span>
                        </Button>
                    </div>
                </div>

                {/* TAB: Pagos a Modelos */}
                <TabsContent value="models" className="space-y-4 mt-0">
                    {/* Sub-tabs para estado */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center rounded-lg border bg-background p-1 gap-1">
                            {['pending', 'paid', 'all'].map(tab => (
                                <Button
                                    key={tab}
                                    variant={modelStatusTab === tab ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setModelStatusTab(tab)}
                                    className="gap-1.5 h-7 text-xs"
                                >
                                    {tab === 'pending' && <Clock className="h-3.5 w-3.5" />}
                                    {tab === 'paid' && <CheckCircle2 className="h-3.5 w-3.5" />}
                                    {tab === 'all' && <FileText className="h-3.5 w-3.5" />}
                                    {tab === 'pending' ? 'Pendientes' : tab === 'paid' ? 'Pagados' : 'Todos'}
                                </Button>
                            ))}
                        </div>

                        {/* View Mode */}
                        <div className="flex items-center gap-2">
                            <span className="text-copy-12 text-muted-foreground hidden sm:inline">Vista:</span>
                            <div className="flex items-center rounded-lg border bg-background p-1 gap-1">
                                <Button
                                    variant={viewMode === 'model' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('model')}
                                    className="gap-1.5 h-7 text-xs"
                                >
                                    <User className="h-3.5 w-3.5" />
                                    Modelo
                                </Button>
                                <Button
                                    variant={viewMode === 'project' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('project')}
                                    className="gap-1.5 h-7 text-xs"
                                >
                                    <FolderOpen className="h-3.5 w-3.5" />
                                    Proyecto
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Payment Cards */}
                    <div className="space-y-3">
                        {filteredModelPayments.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-16">
                                    <Wallet className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                    <h3 className="text-heading-20 font-medium mb-2">No hay registros</h3>
                                    <p className="text-copy-14 text-muted-foreground text-center max-w-sm">
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
                                    onMarkAsCancelled={handleMarkAsCancelled}
                                />
                            ))
                        )}
                    </div>
                </TabsContent>

                {/* TAB: Cobros a Clientes */}
                <TabsContent value="clients" className="space-y-4 mt-0">
                    {/* Sub-tabs para estado */}
                    <div className="flex items-center rounded-lg border bg-background p-1 gap-1 w-fit">
                        {['pending', 'invoiced', 'paid', 'all'].map(tab => (
                            <Button
                                key={tab}
                                variant={clientStatusTab === tab ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setClientStatusTab(tab)}
                                className="gap-1.5 h-7 text-xs"
                            >
                                {tab === 'pending' && <Clock className="h-3.5 w-3.5" />}
                                {tab === 'invoiced' && <Receipt className="h-3.5 w-3.5" />}
                                {tab === 'paid' && <CheckCircle2 className="h-3.5 w-3.5" />}
                                {tab === 'all' && <FileText className="h-3.5 w-3.5" />}
                                {tab === 'pending' ? 'Pendientes' : tab === 'invoiced' ? 'Facturados' : tab === 'paid' ? 'Cobrados' : 'Todos'}
                            </Button>
                        ))}
                    </div>

                    {/* Client Billing Cards */}
                    <div className="space-y-3">
                        {filteredClientBilling.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-16">
                                    <Receipt className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                    <h3 className="text-heading-20 font-medium mb-2">No hay registros</h3>
                                    <p className="text-copy-14 text-muted-foreground text-center max-w-sm">
                                        {searchQuery
                                            ? 'No se encontraron registros con ese criterio de búsqueda.'
                                            : clientStatusTab === 'pending'
                                                ? 'No hay cobros pendientes.'
                                                : 'No hay registros en esta categoría.'}
                                    </p>
                                    <p className="text-copy-12 text-muted-foreground mt-2">
                                        Los cobros se generan al agregar un monto de facturación en los proyectos.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            filteredClientBilling.map((item) => (
                                <ClientBillingCard
                                    key={item.project_id}
                                    item={item}
                                />
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

// Componente KPI Card
function KPICard({
    title,
    value,
    description,
    icon: Icon,
    iconClassName,
}: {
    title: string;
    value: string;
    description: string;
    icon: React.ElementType;
    iconClassName?: string;
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-copy-14 font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${iconClassName}`} />
            </CardHeader>
            <CardContent>
                <div className="text-heading-25 font-semibold">{value}</div>
                <p className="text-copy-12 text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    );
}

// Nuevo componente de tarjeta de pago - Diseño limpio estilo Jobs/Norman
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
    const feeText = item.daily_fee ? formatCurrency(item.daily_fee, item.currency) + '/día' : '';
    const breakdownText = item.daily_fee
        ? `${daysText} × ${feeText}`
        : daysText;

    return (
        <Card className="hover:bg-muted/30 transition-colors">
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                    {/* Left: Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                        {/* Nombre del modelo */}
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-base truncate">{modelDisplay}</h3>
                            {item.model_alias && (
                                <span className="text-copy-12 text-muted-foreground truncate">
                                    {item.model_name}
                                </span>
                            )}
                        </div>

                        {/* Proyecto y cliente */}
                        <div className="flex items-center gap-2 text-copy-14 text-muted-foreground">
                            <Link
                                href={`/dashboard/projects/${item.project_id}`}
                                className="truncate hover:text-foreground hover:underline transition-colors"
                            >
                                {item.project_name}
                            </Link>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                <span className="truncate">{clientDisplay}</span>
                            </div>
                        </div>

                        {/* Fechas y desglose */}
                        <div className="flex items-center gap-3 text-copy-12 text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDateRange(item.first_work_date, item.last_work_date)}</span>
                            </div>
                            <span className="text-foreground/70">({breakdownText})</span>
                        </div>
                    </div>

                    {/* Right: Amount and Status */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        {/* Monto total */}
                        <div className="text-right">
                            <div className="text-lg font-bold">
                                {formatCurrency(item.total_amount, item.currency)}
                            </div>
                            {status === 'partial' && item.total_paid > 0 && (
                                <div className="text-copy-12 text-muted-foreground">
                                    Pagado: {formatCurrency(item.total_paid, item.currency)}
                                </div>
                            )}
                        </div>

                        {/* Status badge y acciones */}
                        <div className="flex items-center gap-2">
                            <Badge variant={statusConfig.badgeVariant} className="gap-1">
                                <StatusIcon className={`h-3 w-3 ${statusConfig.className}`} />
                                {statusConfig.label}
                            </Badge>
                            {status === 'paid' && item.payment_date && (
                                <span className="text-copy-12 text-muted-foreground">
                                    {format(parseISO(item.payment_date), "d MMM yyyy", { locale: es })}
                                </span>
                            )}

                            {(status === 'pending' || status === 'partial') && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={onMarkAsPaid}>
                                            <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
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
            </CardContent>
        </Card>
    );
}

// Componente para agrupar por proyecto
function ProjectGroupCard({
    group,
    onMarkAsPaid,
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
        models: FinanceSummaryItem[];
    };
    onMarkAsPaid: (item: FinanceSummaryItem) => void;
    onMarkAsCancelled: (item: FinanceSummaryItem) => void;
}) {
    const [isOpen, setIsOpen] = React.useState(false);
    const clientDisplay = group.brand_name || group.client_name || '-';
    const pendingModels = group.models.filter(m => m.payment_status === 'pending' || m.payment_status === 'partial');
    const hasPendingPayments = pendingModels.length > 0;

    const handleMarkAllAsPaid = async () => {
        for (const model of pendingModels) {
            await onMarkAsPaid(model);
        }
    };

    return (
        <Card className="hover:bg-muted/30 transition-colors">
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                        {/* Left: Project Info */}
                        <div className="flex-1 min-w-0">
                            <CollapsibleTrigger className="flex items-center gap-2 hover:text-primary transition-colors w-full text-left">
                                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
                                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                                <h3 className="font-semibold text-base truncate">{group.project_name}</h3>
                            </CollapsibleTrigger>
                            <div className="flex items-center gap-2 text-copy-14 text-muted-foreground mt-1 ml-6">
                                <Building2 className="h-3 w-3" />
                                <span>{clientDisplay}</span>
                                <span>•</span>
                                <span>{group.models.length} {group.models.length === 1 ? 'modelo' : 'modelos'}</span>
                                {hasPendingPayments && (
                                    <>
                                        <span>•</span>
                                        <Badge variant="outline" className="text-xs gap-1">
                                            <Clock className="h-3 w-3 text-yellow-600" />
                                            {pendingModels.length} pendiente{pendingModels.length !== 1 && 's'}
                                        </Badge>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Right: Total and Actions */}
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <div className="text-right">
                                <div className="text-lg font-bold">
                                    {formatCurrency(group.total_pending, group.currency)}
                                </div>
                                <div className="text-copy-12 text-muted-foreground">
                                    de {formatCurrency(group.total_amount, group.currency)}
                                </div>
                            </div>
                            {hasPendingPayments && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleMarkAllAsPaid}
                                    className="gap-1.5 text-xs"
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                    Pagar Todo
                                </Button>
                            )}
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

                                return (
                                    <div
                                        key={model.id}
                                        className="flex items-center justify-between gap-4 py-2 px-3 rounded-lg bg-muted/30"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                            <div className="min-w-0">
                                                <div className="font-medium truncate">{modelDisplay}</div>
                                                <div className="text-copy-12 text-muted-foreground">
                                                    {daysText} × {formatCurrency(model.daily_fee, model.currency)}/día
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <div className="text-right">
                                                <div className="font-semibold">
                                                    {formatCurrency(model.pending_amount, model.currency)}
                                                </div>
                                            </div>
                                            <Badge variant={statusConfig.badgeVariant} className="gap-1 text-xs">
                                                <StatusIcon className={`h-3 w-3 ${statusConfig.className}`} />
                                                {statusConfig.label}
                                            </Badge>
                                            {status === 'paid' && model.payment_date && (
                                                <span className="text-copy-12 text-muted-foreground">
                                                    {format(parseISO(model.payment_date), "d MMM", { locale: es })}
                                                </span>
                                            )}
                                            {(status === 'pending' || status === 'partial') && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => onMarkAsPaid(model)}>
                                                            <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
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

// Componente para mostrar cobros a clientes
function ClientBillingCard({ item }: { item: ClientBillingItem }) {
    const statusConfig = CLIENT_PAYMENT_STATUS_CONFIG[item.payment_status];
    const StatusIcon = statusConfig.icon;

    const clientDisplay = item.registered_client_name || item.client_name || 'Sin cliente';

    return (
        <Card className="hover:bg-muted/30 transition-colors">
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                    {/* Left: Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                        {/* Nombre del proyecto */}
                        <div className="flex items-center gap-2">
                            <FolderOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <Link
                                href={`/dashboard/projects/${item.project_id}`}
                                className="font-semibold text-base truncate hover:text-primary hover:underline transition-colors"
                            >
                                {item.project_name}
                            </Link>
                        </div>

                        {/* Cliente y marca */}
                        <div className="flex items-center gap-2 text-copy-14 text-muted-foreground ml-6">
                            <Building2 className="h-3 w-3" />
                            <span>{clientDisplay}</span>
                            {item.brand_name && (
                                <>
                                    <span>•</span>
                                    <span className="truncate">{item.brand_name}</span>
                                </>
                            )}
                        </div>

                        {/* Factura info */}
                        {item.invoice_number && (
                            <div className="flex items-center gap-2 text-copy-12 text-muted-foreground ml-6">
                                <Receipt className="h-3 w-3" />
                                <span>Factura #{item.invoice_number}</span>
                                {item.invoice_date && (
                                    <span>({format(parseISO(item.invoice_date), "d MMM yyyy", { locale: es })})</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right: Amounts and Status */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        {/* Monto con desglose */}
                        <div className="text-right">
                            <div className="text-lg font-bold">
                                {formatCurrency(item.total_with_tax, item.currency)}
                            </div>
                            <div className="text-copy-12 text-muted-foreground">
                                {formatCurrency(item.subtotal, item.currency)} + {item.tax_percentage}% IVA
                            </div>
                        </div>

                        {/* Status badge */}
                        <div className="flex items-center gap-2">
                            <Badge variant={statusConfig.badgeVariant} className="gap-1">
                                <StatusIcon className={`h-3 w-3 ${statusConfig.className}`} />
                                {statusConfig.label}
                            </Badge>
                            {item.payment_status === 'paid' && item.payment_date && (
                                <span className="text-copy-12 text-muted-foreground">
                                    {format(parseISO(item.payment_date), "d MMM yyyy", { locale: es })}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
