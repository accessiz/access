import type { ClientBillingItem, ClientPaymentStatus } from '@/app/(dashboard)/dashboard/finances/page';

export interface ClientBillingCardProps {
    item: ClientBillingItem;
    onUpdateStatus: (newStatus: ClientPaymentStatus) => void;
}
