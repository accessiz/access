"use client";

/**
 * Format a number as currency with the given currency code
 * Uses Intl.NumberFormat for proper locale-aware formatting
 */
export function formatCurrency(amount: number | null | undefined, currency: string = 'GTQ'): string {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('es-GT', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}
