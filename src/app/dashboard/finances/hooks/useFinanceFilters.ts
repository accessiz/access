'use client';

import { useState, useMemo, useCallback, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { type MonthValue } from '@/components/molecules/MonthSelect';
import { type YearValue } from '@/components/molecules/YearSelect';
import { getCurrentMonthInGuatemala, getCurrentYearInGuatemala } from '@/lib/finance/utils';
import { FinanceSummaryItem, FinanceKPIs, ClientBillingItem } from '../page';

export type UseFinanceFiltersProps = {
    initialModelPayments: FinanceSummaryItem[];
    initialClientBilling: ClientBillingItem[];
};

export type UseFinanceFiltersReturn = {
    // Data state
    modelPayments: FinanceSummaryItem[];
    setModelPayments: React.Dispatch<React.SetStateAction<FinanceSummaryItem[]>>;
    clientBilling: ClientBillingItem[];
    setClientBilling: React.Dispatch<React.SetStateAction<ClientBillingItem[]>>;

    // Filter state
    searchQuery: string;
    setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
    mainTab: string;
    setMainTab: React.Dispatch<React.SetStateAction<string>>;
    modelStatusTab: string;
    setModelStatusTab: React.Dispatch<React.SetStateAction<string>>;
    clientStatusTab: string;
    setClientStatusTab: React.Dispatch<React.SetStateAction<string>>;
    viewMode: 'model' | 'project';
    setViewMode: React.Dispatch<React.SetStateAction<'model' | 'project'>>;

    // Date filter state
    selectedMonth: MonthValue;
    setSelectedMonth: React.Dispatch<React.SetStateAction<MonthValue>>;
    selectedYear: YearValue;
    setSelectedYear: React.Dispatch<React.SetStateAction<YearValue>>;
    periodFilter: 'all' | 'q1' | 'q2';
    setPeriodFilter: React.Dispatch<React.SetStateAction<'all' | 'q1' | 'q2'>>;

    // Transition state
    isPending: boolean;
    startTransition: React.TransitionStartFunction;

    // Computed values
    kpis: FinanceKPIs;
    availableYears: number[];
    filteredModelPayments: FinanceSummaryItem[];
    filteredClientBilling: ClientBillingItem[];
    itemsByProject: ProjectGroup[];
    getDayRange: () => { startDay: number; endDay: number } | null;
    monthNames: string[];
};

export type ProjectGroup = {
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

export function useFinanceFilters({
    initialModelPayments,
    initialClientBilling,
}: UseFinanceFiltersProps): UseFinanceFiltersReturn {
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    // Data state
    const [modelPayments, setModelPayments] = useState<FinanceSummaryItem[]>(initialModelPayments);
    const [clientBilling, setClientBilling] = useState<ClientBillingItem[]>(initialClientBilling);

    // Filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [mainTab, setMainTab] = useState(() => {
        const tabParam = searchParams.get('tab');
        return tabParam === 'clients' ? 'clients' : 'models';
    });
    const [modelStatusTab, setModelStatusTab] = useState('pending');
    const [clientStatusTab, setClientStatusTab] = useState('pending');
    const [viewMode, setViewMode] = useState<'model' | 'project'>('model');

    // Date filter state
    const [selectedMonth, setSelectedMonth] = useState<MonthValue>(
        () => String(getCurrentMonthInGuatemala()) as MonthValue
    );
    const [selectedYear, setSelectedYear] = useState<YearValue>(
        () => String(getCurrentYearInGuatemala()) as YearValue
    );
    const [periodFilter, setPeriodFilter] = useState<'all' | 'q1' | 'q2'>('all');

    // Month names in Spanish
    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    // KPIs computed dynamically
    const kpis = useMemo<FinanceKPIs>(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const pendingModelItems = modelPayments.filter(
            i => i.payment_status === 'pending' || i.payment_status === 'partial'
        );
        const paidModelsThisMonth = modelPayments.filter(i =>
            i.payment_status === 'paid' &&
            i.payment_date &&
            new Date(i.payment_date) >= startOfMonth
        );

        const pendingClientItems = clientBilling.filter(
            i => i.payment_status === 'pending' || i.payment_status === 'invoiced'
        );
        const receivedThisMonth = clientBilling.filter(i =>
            i.payment_status === 'paid' &&
            i.payment_date &&
            new Date(i.payment_date) >= startOfMonth
        );

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

    // Available years
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

    // Get day range based on period filter
    const getDayRange = useCallback(() => {
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
    const isInSelectedPeriod = useCallback((dateStr: string | null) => {
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

    // Filter model payments
    const filteredModelPayments = useMemo(() => {
        let filtered = modelPayments;

        // Exclude items with zero total amount (cash + trade)
        filtered = filtered.filter(i => (i.total_amount || 0) + (i.total_trade_value || 0) > 0);

        filtered = filtered.filter(i => isInSelectedPeriod(i.first_work_date));

        if (modelStatusTab === 'pending') {
            filtered = filtered.filter(i => i.payment_status === 'pending' || i.payment_status === 'partial');
        } else if (modelStatusTab === 'paid') {
            filtered = filtered.filter(i => i.payment_status === 'paid');
        }

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

    // Filter client billing
    const filteredClientBilling = useMemo(() => {
        let filtered = clientBilling;

        // Exclude items with zero billing amount
        filtered = filtered.filter(i => i.total_with_tax > 0);

        filtered = filtered.filter(i => isInSelectedPeriod(i.created_at));

        if (clientStatusTab === 'pending') {
            filtered = filtered.filter(i => i.payment_status === 'pending');
        } else if (clientStatusTab === 'invoiced') {
            filtered = filtered.filter(i => i.payment_status === 'invoiced');
        } else if (clientStatusTab === 'paid') {
            filtered = filtered.filter(i => i.payment_status === 'paid');
        }

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

    // Group items by project
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

    return {
        modelPayments,
        setModelPayments,
        clientBilling,
        setClientBilling,
        searchQuery,
        setSearchQuery,
        mainTab,
        setMainTab,
        modelStatusTab,
        setModelStatusTab,
        clientStatusTab,
        setClientStatusTab,
        viewMode,
        setViewMode,
        selectedMonth,
        setSelectedMonth,
        selectedYear,
        setSelectedYear,
        periodFilter,
        setPeriodFilter,
        isPending,
        startTransition,
        kpis,
        availableYears,
        filteredModelPayments,
        filteredClientBilling,
        itemsByProject,
        getDayRange,
        monthNames,
    };
}
