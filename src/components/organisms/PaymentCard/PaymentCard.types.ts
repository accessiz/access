import type { FinanceSummaryItem } from '@/app/(dashboard)/dashboard/finances/page';

export interface PaymentCardProps {
    item: FinanceSummaryItem;
    onMarkAsPaid: () => void;
    onMarkAsCancelled: () => void;
    currentRate: number;
}
