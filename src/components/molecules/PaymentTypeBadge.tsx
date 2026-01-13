'use client';

import { Badge } from '@/components/ui/badge';
import { Banknote, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PaymentType = 'cash' | 'trade' | 'mixed' | null;

interface PaymentTypeBadgeProps {
    /** Type of payment */
    paymentType: PaymentType;
    /** Cash amount for display (optional, shows in badge when provided) */
    cashAmount?: number | null;
    /** Trade/barter amount for display (optional, shows in badge when provided) */
    tradeAmount?: number | null;
    /** Currency code (default: GTQ) */
    currency?: string;
    /** Size variant */
    size?: 'small' | 'medium';
    /** Additional className */
    className?: string;
    /** Show amounts even for single type (default: false for single, true for mixed) */
    showAmounts?: boolean;
}

/**
 * PaymentTypeBadge - Shows payment type with optional amounts
 * 
 * - cash → Green badge "Efectivo" 
 * - trade → Blue badge "Canje"
 * - mixed → Both badges with amounts
 */
export function PaymentTypeBadge({
    paymentType,
    cashAmount,
    tradeAmount,
    currency = 'GTQ',
    size = 'small',
    className,
    showAmounts = false,
}: PaymentTypeBadgeProps) {
    if (!paymentType) return null;

    const formatAmount = (amount: number | null | undefined) => {
        if (amount === null || amount === undefined) return null;
        return `${currency} ${amount.toLocaleString()}`;
    };

    // For mixed, always show both badges with amounts
    if (paymentType === 'mixed') {
        const cashDisplay = formatAmount(cashAmount);
        const tradeDisplay = formatAmount(tradeAmount);

        return (
            <div className={cn('flex flex-wrap items-center gap-1', className)}>
                {(cashAmount ?? 0) > 0 && (
                    <Badge
                        variant="success"
                        size={size}
                        className="gap-1"
                    >
                        <Banknote className="h-3 w-3" />
                        {cashDisplay || 'Efectivo'}
                    </Badge>
                )}
                {(tradeAmount ?? 0) > 0 && (
                    <Badge
                        variant="blue"
                        size={size}
                        className="gap-1"
                    >
                        <RefreshCw className="h-3 w-3" />
                        {tradeDisplay || 'Canje'}
                    </Badge>
                )}
            </div>
        );
    }

    // Single type badges
    if (paymentType === 'cash') {
        const display = showAmounts && cashAmount ? formatAmount(cashAmount) : 'Efectivo';
        return (
            <Badge
                variant="success"
                size={size}
                className={cn('gap-1', className)}
            >
                <Banknote className="h-3 w-3" />
                {display}
            </Badge>
        );
    }

    if (paymentType === 'trade') {
        const display = showAmounts && tradeAmount ? formatAmount(tradeAmount) : 'Canje';
        return (
            <Badge
                variant="blue"
                size={size}
                className={cn('gap-1', className)}
            >
                <RefreshCw className="h-3 w-3" />
                {display}
            </Badge>
        );
    }

    return null;
}

/**
 * Helper to determine payment type from amounts
 */
export function getPaymentTypeFromAmounts(
    cashAmount: number | null | undefined,
    tradeAmount: number | null | undefined
): PaymentType {
    const hasCash = (cashAmount ?? 0) > 0;
    const hasTrade = (tradeAmount ?? 0) > 0;

    if (hasCash && hasTrade) return 'mixed';
    if (hasTrade) return 'trade';
    if (hasCash) return 'cash';
    return null;
}
