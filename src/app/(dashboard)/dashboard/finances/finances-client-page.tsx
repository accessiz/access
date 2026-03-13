'use client';

import {
    Wallet,
    TrendingUp,
    Users,
    Clock,
    CheckCircle2,
    AlertCircle,
    Building2,
    FileText,
    FolderOpen,
    User,
    Download,
    Receipt,
    Banknote,
    RefreshCw,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { KPICard } from '@/components/molecules/KPICard';
import { SearchBar } from '@/components/molecules/SearchBar';
import { SegmentedControl } from '@/components/molecules/SegmentedControl';
import { MonthSelect } from '@/components/molecules/MonthSelect';
import { YearSelect } from '@/components/molecules/YearSelect';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

// Extracted Organisms
import { PaymentCard } from '@/components/organisms/PaymentCard';
import { ProjectGroupCard } from '@/components/organisms/ProjectGroupCard';
import { ClientBillingCard } from '@/components/organisms/ClientBillingCard';

// Finance utilities
import { formatCurrency } from '@/lib/finance/utils';

// Import types from page
import { FinanceSummaryItem, FinanceKPIs, ClientBillingItem } from './page';

// Custom hooks
import { useFinanceFilters } from './hooks/useFinanceFilters';
import { useFinancePayments } from './hooks/useFinancePayments';

type FinancesClientPageProps = {
    initialData: {
        modelPayments: FinanceSummaryItem[];
        clientBilling: ClientBillingItem[];
        kpis: FinanceKPIs;
        currentExchangeRate: number;
    };
};

export default function FinancesClientPage({ initialData }: FinancesClientPageProps) {
    // Use extracted hooks
    const filters = useFinanceFilters({
        initialModelPayments: initialData.modelPayments,
        initialClientBilling: initialData.clientBilling,
    });

    const payments = useFinancePayments({
        setModelPayments: filters.setModelPayments,
        setClientBilling: filters.setClientBilling,
        selectedMonth: filters.selectedMonth,
        selectedYear: filters.selectedYear,
        periodFilter: filters.periodFilter,
        getDayRange: filters.getDayRange,
        monthNames: filters.monthNames,
    });

    return (
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-6 pb-6">
            <header className="flex flex-col gap-x-4 gap-y-4 pb-4 border-b sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-display font-semibold">Finanzas</h1>
                </div>
            </header>

            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <KPICard
                    title="Por Cobrar"
                    value={formatCurrency(filters.kpis.totalPendingClients)}
                    icon={Receipt}
                    iconClassName="text-warning"
                />
                <KPICard
                    title="Por Pagar"
                    value={formatCurrency(filters.kpis.totalPendingModels)}
                    icon={Wallet}
                    iconClassName="text-orange"
                />
                <KPICard
                    title="Margen Bruto"
                    value={formatCurrency(filters.kpis.grossMargin)}
                    icon={TrendingUp}
                    iconClassName={filters.kpis.grossMargin >= 0 ? "text-success" : "text-destructive"}
                />
                <KPICard
                    title="Modelos Pendientes"
                    value={filters.kpis.modelsWithPendingPayments.toString()}
                    icon={Users}
                    iconClassName="text-accent"
                />
            </div>

            {/* Main Tabs: Pagos a Modelos / Cobros a Clientes */}
            <Tabs value={filters.mainTab} onValueChange={filters.setMainTab} className="space-y-4">
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
                                years={filters.availableYears}
                                includeAll
                                value={filters.selectedYear}
                                onValueChange={filters.setSelectedYear}
                                placeholder="Año"
                                triggerClassName="w-full sm:w-24"
                            />
                            <MonthSelect
                                includeAll
                                value={filters.selectedMonth}
                                onValueChange={filters.setSelectedMonth}
                                placeholder="Mes"
                                triggerClassName="w-full sm:w-32"
                            />
                        </div>

                        {/* Period Toggle */}
                        <div className="col-span-2 w-full sm:w-auto">
                            <SegmentedControl
                                ariaLabel="Periodo"
                                value={filters.periodFilter}
                                onValueChange={filters.setPeriodFilter}
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
                                value={filters.searchQuery}
                                onValueChange={filters.setSearchQuery}
                                className="w-full sm:w-45"
                            />
                        </div>

                        {/* Export Button */}
                        <div className="col-span-2 w-full sm:w-auto">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => payments.handleExport(filters.mainTab === 'models' ? 'models' : 'clients')}
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
                    <div className="flex flex-col gap-x-4 gap-y-4 sm:flex-row sm:items-center sm:justify-between">
                        <SegmentedControl
                            ariaLabel="Estado de pagos a modelos"
                            value={filters.modelStatusTab}
                            onValueChange={filters.setModelStatusTab}
                            options={[
                                { value: 'pending', label: 'Pendientes', icon: <Clock className="h-3.5 w-3.5" /> },
                                { value: 'paid', label: 'Pagados', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
                                { value: 'all', label: 'Todos', icon: <FileText className="h-3.5 w-3.5" />, mobileColSpan: 2 },
                            ]}
                        />

                        <div className="flex items-center gap-x-2 gap-y-2">
                            <span className="text-label text-muted-foreground hidden sm:inline">Vista:</span>
                            <SegmentedControl
                                ariaLabel="Modo de vista"
                                value={filters.viewMode}
                                onValueChange={filters.setViewMode}
                                mobileColumns={2}
                                options={[
                                    { value: 'model', label: 'Modelo', icon: <User className="h-3.5 w-3.5" /> },
                                    { value: 'project', label: 'Proyecto', icon: <FolderOpen className="h-3.5 w-3.5" /> },
                                ]}
                            />
                        </div>
                    </div>

                    <div className={`space-y-3 transition-opacity duration-150 ${filters.isPending ? 'opacity-60' : ''}`}>
                        {filters.filteredModelPayments.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-16">
                                    <Wallet className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                    <h3 className="text-title font-medium mb-2">No hay registros</h3>
                                    <p className="text-body text-muted-foreground text-center max-w-sm">
                                        {filters.searchQuery
                                            ? 'No se encontraron registros con ese criterio de búsqueda.'
                                            : filters.modelStatusTab === 'pending'
                                                ? 'No hay pagos pendientes. ¡Excelente!'
                                                : 'No hay registros en esta categoría.'}
                                    </p>
                                </CardContent>
                            </Card>
                        ) : filters.viewMode === 'model' ? (
                            filters.filteredModelPayments.map((item) => (
                                <div key={item.id} className="cv-auto-sm">
                                    <PaymentCard
                                        item={item}
                                        onMarkAsPaid={() => payments.handleMarkAsPaid(item)}
                                        onMarkAsCancelled={() => payments.handleMarkAsCancelled(item)}
                                        currentRate={initialData.currentExchangeRate}
                                    />
                                </div>
                            ))
                        ) : (
                            filters.itemsByProject.map((group) => (
                                <div key={group.project_id} className="cv-auto-sm">
                                    <ProjectGroupCard
                                        group={group}
                                        onMarkAsPaid={payments.handleMarkAsPaid}
                                        onMarkAllAsPaid={(pendingModels) => payments.handleMarkAllAsPaidForProject(pendingModels, group.project_name)}
                                        onMarkAsCancelled={payments.handleMarkAsCancelled}
                                        currentRate={initialData.currentExchangeRate}
                                    />
                                </div>
                            ))
                        )}
                    </div>
                </TabsContent>

                {/* TAB: Cobros a Clientes */}
                <TabsContent value="clients" className="space-y-4 mt-0">
                    <SegmentedControl
                        ariaLabel="Estado de cobros a clientes"
                        value={filters.clientStatusTab}
                        onValueChange={filters.setClientStatusTab}
                        options={[
                            { value: 'pending', label: 'Pendientes', icon: <Clock className="h-3.5 w-3.5" /> },
                            { value: 'invoiced', label: 'Facturados', icon: <Receipt className="h-3.5 w-3.5" /> },
                            { value: 'paid', label: 'Cobrados', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
                            { value: 'all', label: 'Todos', icon: <FileText className="h-3.5 w-3.5" /> },
                        ]}
                    />

                    <div className={`space-y-3 transition-opacity duration-150 ${filters.isPending ? 'opacity-60' : ''}`}>
                        {filters.filteredClientBilling.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-16">
                                    <Receipt className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                    <h3 className="text-title font-medium mb-2">No hay registros</h3>
                                    <p className="text-body text-muted-foreground text-center max-w-sm">
                                        {filters.searchQuery
                                            ? 'No se encontraron registros con ese criterio de búsqueda.'
                                            : filters.clientStatusTab === 'pending'
                                                ? 'No hay cobros pendientes.'
                                                : 'No hay registros en esta categoría.'}
                                    </p>
                                    <p className="text-label text-muted-foreground mt-2">
                                        Los cobros se generan al agregar un monto de facturación en los proyectos.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            filters.filteredClientBilling.map((item) => (
                                <div key={item.project_id} className="cv-auto-sm">
                                    <ClientBillingCard
                                        item={item}
                                        onUpdateStatus={(newStatus) => payments.handleUpdateClientPaymentStatus(item, newStatus)}
                                    />
                                </div>
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Payment Confirmation Dialog */}
            <Dialog open={payments.paymentDialogOpen} onOpenChange={payments.setPaymentDialogOpen}>
                <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Confirmar Pago</DialogTitle>
                        <DialogDescription asChild>
                            <div className="space-y-1">
                                {payments.selectedPaymentItem ? (
                                    <span className="block">
                                        ¿Confirmas el pago a <strong>{payments.selectedPaymentItem.model_alias || payments.selectedPaymentItem.model_name}</strong>?
                                    </span>
                                ) : payments.selectedPaymentItems.length > 0 ? (
                                    <span className="block">
                                        ¿Confirmas el pago a <strong>{payments.selectedPaymentItems.length} modelo{payments.selectedPaymentItems.length !== 1 ? 's' : ''}</strong> del proyecto <strong>{payments.selectedProjectName}</strong>?
                                    </span>
                                ) : null}
                            </div>
                        </DialogDescription>
                    </DialogHeader>

                    {/* Single payment view */}
                    {payments.selectedPaymentItem && (
                        <div className="py-4 space-y-4">
                            <div className="flex flex-col gap-3">
                                {(payments.selectedPaymentItem.daily_fee ?? 0) > 0 && (
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-quaternary">
                                        <div className="w-10 h-10 rounded-full border-2 border-success bg-success/20 flex items-center justify-center shrink-0">
                                            <Banknote className="w-5 h-5 text-success" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-body font-medium text-foreground">Efectivo</p>
                                            <p className="text-label text-muted-foreground">
                                                {payments.selectedPaymentItem.days_worked} {payments.selectedPaymentItem.days_worked === 1 ? 'día' : 'días'} × {formatCurrency(payments.selectedPaymentItem.daily_fee, payments.selectedPaymentItem.currency)}/día
                                            </p>
                                        </div>
                                        <span className="text-title font-bold text-foreground">
                                            {formatCurrency(payments.selectedPaymentItem.total_amount, payments.selectedPaymentItem.currency)}
                                        </span>
                                    </div>
                                )}
                                {(payments.selectedPaymentItem.daily_trade_fee ?? 0) > 0 && (
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-quaternary">
                                        <div className="w-10 h-10 rounded-full border-2 border-blue bg-blue/20 flex items-center justify-center shrink-0">
                                            <RefreshCw className="w-5 h-5 text-blue" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-body font-medium text-foreground">Canje</p>
                                            <p className="text-label text-muted-foreground">
                                                {payments.selectedPaymentItem.days_worked} {payments.selectedPaymentItem.days_worked === 1 ? 'día' : 'días'} × {formatCurrency(payments.selectedPaymentItem.daily_trade_fee, payments.selectedPaymentItem.currency)}/día
                                            </p>
                                        </div>
                                        <span className="text-title font-bold text-foreground">
                                            {formatCurrency(payments.selectedPaymentItem.total_trade_value || 0, payments.selectedPaymentItem.currency)}
                                        </span>
                                    </div>
                                )}
                                {(payments.selectedPaymentItem.daily_fee ?? 0) === 0 && (payments.selectedPaymentItem.daily_trade_fee ?? 0) === 0 && (
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
                                <span className="truncate">{payments.selectedPaymentItem.project_name}</span>
                            </div>
                        </div>
                    )}

                    {/* Batch payment view */}
                    {payments.selectedPaymentItems.length > 0 && (
                        <div className="py-4 space-y-4">
                            <div className="flex flex-col gap-2">
                                {payments.selectedPaymentItems.map((item) => {
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

                            <Separator />
                            <div className="flex flex-col gap-2">
                                {(() => {
                                    const totalCash = payments.selectedPaymentItems.reduce((sum, i) => sum + (i.total_amount || 0), 0);
                                    const totalTrade = payments.selectedPaymentItems.reduce((sum, i) => sum + (i.total_trade_value || 0), 0);
                                    const currency = payments.selectedPaymentItems[0]?.currency || 'GTQ';
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
                            onClick={() => payments.setPaymentDialogOpen(false)}
                            className="border-separator bg-transparent hover:bg-hover-overlay"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={payments.confirmPayment}
                            className="gap-2 bg-[rgb(var(--purple))] hover:bg-[rgb(var(--purple))]/90 text-white"
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            {payments.selectedPaymentItems.length > 1
                                ? `Confirmar ${payments.selectedPaymentItems.length} Pagos`
                                : 'Confirmar Pago'
                            }
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
