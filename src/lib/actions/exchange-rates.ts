'use server';

import { createClient } from '@/lib/supabase/server';
import { fetchCurrentRate } from '@/lib/utils/currency';

/**
 * Get today's exchange rate, caching it in the database
 */
export async function getExchangeRate(): Promise<{
    success: boolean;
    rate?: number;
    error?: string;
}> {
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];

    try {
        // Check if we already have today's rate
        const { data: cached } = await supabase
            .from('exchange_rates')
            .select('usd_to_gtq')
            .eq('date', today)
            .single();

        if (cached?.usd_to_gtq) {
            return { success: true, rate: cached.usd_to_gtq };
        }

        // Fetch new rate from API
        const rate = await fetchCurrentRate();

        // Store in database (upsert to handle race conditions)
        const { error: insertError } = await supabase
            .from('exchange_rates')
            .upsert(
                { date: today, usd_to_gtq: rate },
                { onConflict: 'date' }
            );

        if (insertError) {
            // Debug only - cache write is non-blocking, rate is still returned
            console.debug('[ExchangeRate] Cache write skipped:', insertError.code || insertError.message);
            // Still return the rate even if caching failed
        }

        return { success: true, rate };
    } catch (error) {
        console.error('Error getting exchange rate:', error);
        return {
            success: false,
            error: 'No se pudo obtener la tasa de cambio'
        };
    }
}

/**
 * Update exchange rate for today (can be called by cron job)
 */
export async function updateTodayRate(): Promise<{
    success: boolean;
    rate?: number;
    error?: string;
}> {
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];

    try {
        const rate = await fetchCurrentRate();

        const { error } = await supabase
            .from('exchange_rates')
            .upsert(
                { date: today, usd_to_gtq: rate, fetched_at: new Date().toISOString() },
                { onConflict: 'date' }
            );

        if (error) throw error;

        return { success: true, rate };
    } catch (error) {
        console.error('Error updating exchange rate:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Get exchange rate for a specific date (for historical lookups)
 */
export async function getHistoricalRate(date: string): Promise<{
    success: boolean;
    rate?: number;
    error?: string;
}> {
    const supabase = await createClient();

    try {
        // First try exact date
        const { data: exact } = await supabase
            .from('exchange_rates')
            .select('usd_to_gtq')
            .eq('date', date)
            .single();

        if (exact?.usd_to_gtq) {
            return { success: true, rate: exact.usd_to_gtq };
        }

        // If no exact match, get closest previous date
        const { data: closest } = await supabase
            .from('exchange_rates')
            .select('usd_to_gtq')
            .lt('date', date)
            .order('date', { ascending: false })
            .limit(1)
            .single();

        if (closest?.usd_to_gtq) {
            return { success: true, rate: closest.usd_to_gtq };
        }

        // No historical data, return current rate
        return await getExchangeRate();
    } catch (error) {
        console.error('Error getting historical rate:', error);
        return {
            success: false,
            error: 'No se encontró tasa histórica'
        };
    }
}
