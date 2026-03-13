import type { FinanceSummaryItem } from '@/app/(dashboard)/dashboard/finances/page';

export interface ProjectGroup {
    project_id: string;
    project_name: string;
    client_name: string | null;
    brand_name: string | null;
    currency: string;
    total_pending: number;
    total_amount: number;
    total_trade_value: number;
    models: FinanceSummaryItem[];
}

export interface ProjectGroupCardProps {
    group: ProjectGroup;
    onMarkAsPaid: (item: FinanceSummaryItem) => void;
    onMarkAllAsPaid: (pendingModels: FinanceSummaryItem[]) => void;
    onMarkAsCancelled: (item: FinanceSummaryItem) => void;
    currentRate: number;
}
