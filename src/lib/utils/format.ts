"use client";

// Re-export the canonical formatCurrency from currency.ts to maintain the import path
// for client components. The canonical implementation (with `minimumFractionDigits: 2`)
// lives in @/lib/utils/currency.
export { formatCurrency } from '@/lib/utils/currency';
