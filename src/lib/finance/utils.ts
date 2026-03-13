import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export const GUATEMALA_TIME_ZONE = 'America/Guatemala';

// Re-export the canonical formatCurrency so existing imports keep working
export { formatCurrency } from '@/lib/utils/currency';

/**
 * Formats a date range for display
 */
export function formatDateRange(firstDate: string, lastDate: string): string {
    try {
        const first = parseISO(firstDate);
        const last = parseISO(lastDate);

        if (firstDate === lastDate || first.getTime() === last.getTime()) {
            return format(first, "d 'de' MMM yyyy", { locale: es });
        }

        // Si están en el mismo mes
        if (first.getMonth() === last.getMonth() && first.getFullYear() === last.getFullYear()) {
            return `${format(first, 'd', { locale: es })}-${format(last, "d 'de' MMM yyyy", { locale: es })}`;
        }

        return `${format(first, "d MMM", { locale: es })} - ${format(last, "d MMM yyyy", { locale: es })}`;
    } catch {
        return '-';
    }
}

/**
 * Gets the current month in Guatemala timezone (1-12)
 */
export function getCurrentMonthInGuatemala(): number {
    const monthStr = new Intl.DateTimeFormat('en-US', {
        timeZone: GUATEMALA_TIME_ZONE,
        month: 'numeric',
    }).format(new Date());

    const month = Number(monthStr);
    return month >= 1 && month <= 12 ? month : new Date().getMonth() + 1;
}

/**
 * Gets the current year in Guatemala timezone
 */
export function getCurrentYearInGuatemala(): number {
    const yearStr = new Intl.DateTimeFormat('en-US', {
        timeZone: GUATEMALA_TIME_ZONE,
        year: 'numeric',
    }).format(new Date());

    const year = Number(yearStr);
    return Number.isFinite(year) ? year : new Date().getFullYear();
}
