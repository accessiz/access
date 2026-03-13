/**
 * Currency conversion utilities
 * Handles USD to GTQ conversion with cached exchange rates
 */

import { createClient } from '@/lib/supabase/client';

// Fallback rate if API fails (updated periodically)
const FALLBACK_USD_TO_GTQ = 7.70;

// API endpoint (free, no key required)
const EXCHANGE_RATE_API = 'https://open.er-api.com/v6/latest/USD';

export type SupportedCurrency = 'GTQ' | 'USD' | 'EUR';

interface ExchangeRateResponse {
    result: string;
    rates: {
        GTQ: number;
        EUR: number;
        [key: string]: number;
    };
}

/**
 * Fetch current USD to GTQ rate from external API
 */
export async function fetchCurrentRate(): Promise<number> {
    try {
        const response = await fetch(EXCHANGE_RATE_API, {
            next: { revalidate: 3600 }, // Cache for 1 hour
        });

        if (!response.ok) {
            console.warn('Exchange rate API failed, using fallback');
            return FALLBACK_USD_TO_GTQ;
        }

        const data: ExchangeRateResponse = await response.json();
        return data.rates?.GTQ || FALLBACK_USD_TO_GTQ;
    } catch (error) {
        console.error('Error fetching exchange rate:', error);
        return FALLBACK_USD_TO_GTQ;
    }
}

/**
 * Get today's exchange rate (from cache or API)
 */
export async function getTodayRate(): Promise<number> {
    const supabase = createClient();
    const today = new Date().toISOString().split('T')[0];

    // Try to get cached rate for today
    const { data: cached } = await supabase
        .from('exchange_rates')
        .select('usd_to_gtq')
        .eq('date', today)
        .single();

    if (cached?.usd_to_gtq) {
        return cached.usd_to_gtq;
    }

    // If no cached rate, fetch from API
    return await fetchCurrentRate();
}

/**
 * Convert amount from one currency to GTQ
 */
export function convertToGTQ(
    amount: number,
    fromCurrency: SupportedCurrency,
    exchangeRate: number
): number {
    if (fromCurrency === 'GTQ') {
        return amount;
    }

    if (fromCurrency === 'USD') {
        return amount * exchangeRate;
    }

    // EUR: First convert to USD equivalent, then to GTQ
    // For now, we only support USD properly
    return amount * exchangeRate;
}

/**
 * Format currency for display
 */
export function formatCurrency(
    amount: number | null | undefined,
    currency: SupportedCurrency | string = 'GTQ'
): string {
    if (amount == null) return '-';

    const currencyConfig: Record<SupportedCurrency, { locale: string; currency: string }> = {
        GTQ: { locale: 'es-GT', currency: 'GTQ' },
        USD: { locale: 'en-US', currency: 'USD' },
        EUR: { locale: 'de-DE', currency: 'EUR' },
    };

    const config = currencyConfig[currency as SupportedCurrency] || currencyConfig.GTQ;

    return new Intl.NumberFormat(config.locale, {
        style: 'currency',
        currency: config.currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

/**
 * Format currency with original and converted display
 * Example: "USD 150 (≈ Q 1,150.50)"
 */
export function formatWithConversion(
    amount: number | null | undefined,
    originalCurrency: SupportedCurrency,
    exchangeRate: number
): string {
    if (amount == null) return '-';

    if (originalCurrency === 'GTQ') {
        return formatCurrency(amount, 'GTQ');
    }

    const gtqAmount = convertToGTQ(amount, originalCurrency, exchangeRate);
    return `${formatCurrency(amount, originalCurrency)} (≈ ${formatCurrency(gtqAmount, 'GTQ')})`;
}

/**
 * Get display symbol for currency
 */
export function getCurrencySymbol(currency: SupportedCurrency): string {
    const symbols: Record<SupportedCurrency, string> = {
        GTQ: 'Q',
        USD: '$',
        EUR: '€',
    };
    return symbols[currency] || 'Q';
}
