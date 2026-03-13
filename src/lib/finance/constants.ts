import { Clock, CheckCircle2, AlertCircle, XCircle, Receipt } from 'lucide-react';
import type { PaymentStatus, ClientPaymentStatus } from '@/app/(dashboard)/dashboard/finances/page';

export type PaymentStatusConfig = {
    label: string;
    icon: typeof Clock;
    className: string;
    badgeVariant: 'warning' | 'success' | 'info' | 'neutral' | 'danger';
};

export type ClientPaymentStatusConfig = {
    label: string;
    icon: typeof Clock;
    className: string;
    badgeVariant: 'warning' | 'success' | 'info';
};

// Model payment status configuration
export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, PaymentStatusConfig> = {
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

// Client payment status configuration
export const CLIENT_PAYMENT_STATUS_CONFIG: Record<ClientPaymentStatus, ClientPaymentStatusConfig> = {
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
