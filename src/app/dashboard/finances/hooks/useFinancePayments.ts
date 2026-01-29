'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { type PaymentType } from '@/lib/constants/finance';
import { createClient } from '@/lib/supabase/client';
import { FinanceSummaryItem, PaymentStatus, ClientBillingItem, ClientPaymentStatus } from '../page';
import { type MonthValue } from '@/components/molecules/MonthSelect';
import { type YearValue } from '@/components/molecules/YearSelect';

export type UseFinancePaymentsProps = {
    setModelPayments: React.Dispatch<React.SetStateAction<FinanceSummaryItem[]>>;
    setClientBilling: React.Dispatch<React.SetStateAction<ClientBillingItem[]>>;
    selectedMonth: MonthValue;
    selectedYear: YearValue;
    periodFilter: 'all' | 'q1' | 'q2';
    getDayRange: () => { startDay: number; endDay: number } | null;
    monthNames: string[];
};

export type UseFinancePaymentsReturn = {
    // Dialog state
    paymentDialogOpen: boolean;
    setPaymentDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
    selectedPaymentItem: FinanceSummaryItem | null;
    selectedPaymentItems: FinanceSummaryItem[];
    selectedProjectName: string;
    tradeDescription: string;
    setTradeDescription: React.Dispatch<React.SetStateAction<string>>;

    // Actions
    handleMarkAsPaid: (item: FinanceSummaryItem) => void;
    handleMarkAllAsPaidForProject: (pendingModels: FinanceSummaryItem[], projectName: string) => void;
    confirmPayment: () => Promise<void>;
    handleMarkAsCancelled: (item: FinanceSummaryItem) => Promise<void>;
    handleExport: (type: 'models' | 'clients') => void;
    handleUpdateClientPaymentStatus: (item: ClientBillingItem, newStatus: ClientPaymentStatus) => Promise<void>;
};

export function useFinancePayments({
    setModelPayments,
    setClientBilling,
    selectedMonth,
    selectedYear,
    periodFilter,
    getDayRange,
    monthNames,
}: UseFinancePaymentsProps): UseFinancePaymentsReturn {
    const router = useRouter();

    // Dialog state
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [selectedPaymentItem, setSelectedPaymentItem] = useState<FinanceSummaryItem | null>(null);
    const [selectedPaymentItems, setSelectedPaymentItems] = useState<FinanceSummaryItem[]>([]);
    const [selectedProjectName, setSelectedProjectName] = useState<string>('');
    const [, setSelectedPaymentType] = useState<PaymentType>('cash');
    const [tradeDescription, setTradeDescription] = useState('');

    // Open dialog for single payment
    const handleMarkAsPaid = (item: FinanceSummaryItem) => {
        setSelectedPaymentItem(item);
        setSelectedPaymentItems([]);
        setSelectedProjectName('');
        setSelectedPaymentType('cash');
        setTradeDescription('');
        setPaymentDialogOpen(true);
    };

    // Open dialog for batch payment
    const handleMarkAllAsPaidForProject = (pendingModels: FinanceSummaryItem[], projectName: string) => {
        setSelectedPaymentItem(null);
        setSelectedPaymentItems(pendingModels);
        setSelectedProjectName(projectName);
        setSelectedPaymentType('cash');
        setTradeDescription('');
        setPaymentDialogOpen(true);
    };

    // Confirm payment (single or batch)
    const confirmPayment = async () => {
        const itemsToPay = selectedPaymentItem ? [selectedPaymentItem] : selectedPaymentItems;

        if (itemsToPay.length === 0) return;
        const supabase = createClient();
        let totalDaysUpdated = 0;

        for (const item of itemsToPay) {
            console.log('[confirmPayment] Procesando modelo...', {
                model_id: item.model_id,
                project_id: item.project_id,
            });

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

            let paymentType: PaymentType = 'cash';
            const hasCash = (item.daily_fee ?? 0) > 0;
            const hasTrade = (item.daily_trade_fee ?? 0) > 0;
            if (hasCash && hasTrade) {
                paymentType = 'mixed';
            } else if (hasTrade && !hasCash) {
                paymentType = 'trade';
            }

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

    // Mark as cancelled
    const handleMarkAsCancelled = async (item: FinanceSummaryItem) => {
        const supabase = createClient();

        const { data: schedules } = await supabase
            .from('project_schedule')
            .select('id')
            .eq('project_id', item.project_id);

        if (!schedules || schedules.length === 0) {
            toast.error('No se encontraron fechas para este proyecto');
            return;
        }

        const scheduleIds = schedules.map(s => s.id);

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

    // Export to Excel
    const handleExport = (type: 'models' | 'clients') => {
        const url = new URL('/api/finances/export', window.location.origin);
        url.searchParams.set('type', type);
        if (selectedMonth !== 'all') url.searchParams.set('month', selectedMonth);
        if (selectedYear !== 'all') url.searchParams.set('year', selectedYear);

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

    // Update client payment status
    const handleUpdateClientPaymentStatus = async (item: ClientBillingItem, newStatus: ClientPaymentStatus) => {
        const supabase = createClient();

        const updateData: Partial<{ client_payment_status: string; client_payment_date: string | null }> = {
            client_payment_status: newStatus,
        };

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

        setClientBilling(prev => prev.map(i =>
            i.project_id === item.project_id
                ? { ...i, payment_status: newStatus, payment_date: newStatus === 'paid' ? new Date().toISOString() : i.payment_date }
                : i
        ));

        const statusLabels: Record<string, string> = { pending: 'Pendiente', invoiced: 'Facturado', paid: 'Cobrado' };
        toast.success(`Estado actualizado a: ${statusLabels[newStatus]}`);
        router.refresh();
    };

    return {
        paymentDialogOpen,
        setPaymentDialogOpen,
        selectedPaymentItem,
        selectedPaymentItems,
        selectedProjectName,
        tradeDescription,
        setTradeDescription,
        handleMarkAsPaid,
        handleMarkAllAsPaidForProject,
        confirmPayment,
        handleMarkAsCancelled,
        handleExport,
        handleUpdateClientPaymentStatus,
    };
}
