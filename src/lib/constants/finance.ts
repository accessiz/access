/**
 * Finance Constants
 * 
 * REGLAS DE NEGOCIO PARA FINANZAS:
 * Solo mostrar un pago/modelo en finanzas si cumple TODAS estas condiciones:
 * 1. Modelo aprobado (client_selection = 'approved')
 * 2. Proyecto finalizado (status = 'completed')
 * 3. Fecha del proyecto ya pasó (última fecha de schedule < hoy)
 * 4. Tiene asignación de pago (existe en model_assignments)
 * 
 * Timezone: Guatemala (GMT-6)
 */

export const FINANCE_CONSTANTS = {
    /** Timezone para todas las operaciones de fecha en finanzas */
    TIMEZONE: 'America/Guatemala', // GMT-6

    /** Configuración de monedas */
    CURRENCY: {
        /** Moneda principal para KPIs y reportes */
        PRIMARY: 'GTQ' as const,
        /** Tipos de cambio para conversión a GTQ */
        EXCHANGE_RATES: {
            USD: 7.80, // 1 USD = 7.80 GTQ
            GTQ: 1,
        } as Record<string, number>,
    },

    /** Estados de pago a modelos */
    MODEL_PAYMENT_STATUSES: ['pending', 'paid'] as const,

    /** Estados de cobro a clientes */
    CLIENT_PAYMENT_STATUSES: ['pending', 'invoiced', 'paid'] as const,

    /** Labels en español para estados de pago */
    STATUS_LABELS: {
        pending: 'Pendiente',
        invoiced: 'Facturado',
        paid: 'Cobrado',
    } as Record<string, string>,
} as const;

/** Tipos derivados de las constantes */
export type ModelPaymentStatus = typeof FINANCE_CONSTANTS.MODEL_PAYMENT_STATUSES[number];
export type ClientPaymentStatus = typeof FINANCE_CONSTANTS.CLIENT_PAYMENT_STATUSES[number];

/**
 * Convierte un monto a GTQ usando el tipo de cambio configurado
 */
export function convertToGTQ(amount: number, currency: string): number {
    const rate = FINANCE_CONSTANTS.CURRENCY.EXCHANGE_RATES[currency] ?? 1;
    return amount * rate;
}

/**
 * Obtiene la fecha actual en timezone Guatemala
 */
export function getGuatemalaToday(): Date {
    const now = new Date();
    const guatemalaTime = new Date(now.toLocaleString('en-US', {
        timeZone: FINANCE_CONSTANTS.TIMEZONE
    }));
    guatemalaTime.setHours(0, 0, 0, 0);
    return guatemalaTime;
}

/**
 * Obtiene la fecha actual en timezone Guatemala como string YYYY-MM-DD
 */
export function getGuatemalaTodayString(): string {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: FINANCE_CONSTANTS.TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    return formatter.format(new Date());
}

/**
 * Verifica si un proyecto ya terminó basándose en su schedule
 * @param schedule - Array de fechas del proyecto
 * @returns true si la última fecha del schedule ya pasó (en timezone Guatemala)
 */
export function isProjectDatePassed(schedule: { date: string }[] | null | undefined): boolean {
    if (!schedule || schedule.length === 0) return false;

    const today = getGuatemalaToday();
    const lastDate = new Date(schedule[schedule.length - 1].date);
    lastDate.setHours(23, 59, 59, 999);

    return lastDate < today;
}

/**
 * Verifica si un modelo/pago cumple las 4 condiciones para aparecer en finanzas
 */
export function meetsFinanceConditions(params: {
    clientSelection?: string | null;
    projectStatus?: string | null;
    schedule?: { date: string }[] | null | undefined;
    hasAssignment?: boolean;
}): boolean {
    const { clientSelection, projectStatus, schedule, hasAssignment = true } = params;

    return (
        clientSelection === 'approved' &&
        projectStatus === 'completed' &&
        isProjectDatePassed(schedule) &&
        hasAssignment
    );
}
