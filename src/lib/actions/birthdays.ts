'use server'

import { createClient } from '@/lib/supabase/server'
import { logError } from '@/lib/utils/errors'

export interface BirthdayModel {
    id: string
    alias: string | null
    full_name: string | null
    birth_date: string // YYYY-MM-DD
    cover_path: string | null
    instagram: string | null
}

// Helper para parsear fecha sin timezone issues
// birth_date viene como "YYYY-MM-DD"
const parseBirthDate = (birthDate: string): { year: number; month: number; day: number } => {
    const [year, month, day] = birthDate.split('-').map(Number)
    return { year, month, day }
}

/**
 * Obtiene los modelos que cumplen años en un mes específico
 */
export async function getBirthdaysByMonth(month: number): Promise<{ success: boolean; data?: BirthdayModel[]; error?: string }> {
    try {
        const supabase = await createClient()

        if (month < 1 || month > 12) {
            return { success: false, error: 'Mes inválido' }
        }

        // Para evitar errores de tipos en Postgres (DATE vs ILIKE), 
        // traemos los modelos activos con fecha y filtramos en JS.
        // Esto es más robusto y evita problemas de casting en diferentes entornos.
        const { data, error } = await supabase
            .from('models')
            .select('id, alias, full_name, birth_date, cover_path, instagram')
            .not('birth_date', 'is', null)
            .eq('status', 'active')

        if (error) throw error

        const filtered = (data as BirthdayModel[]).filter(model => {
            const { month: m } = parseBirthDate(model.birth_date)
            return m === month
        }).sort((a, b) => {
            const { day: dayA } = parseBirthDate(a.birth_date)
            const { day: dayB } = parseBirthDate(b.birth_date)
            return dayA - dayB
        })

        return { success: true, data: filtered }
    } catch (error) {
        logError(error, { action: 'getBirthdaysByMonth', month })
        return { success: false, error: 'Error al obtener cumpleaños' }
    }
}

/**
 * Obtiene los modelos que cumplen años hoy
 */
export async function getTodayBirthdays(): Promise<{ success: boolean; data?: BirthdayModel[]; error?: string }> {
    try {
        const supabase = await createClient()

        // Obtener fecha actual en Guatemala (GMT-6)
        const today = new Date()
        const formatter = new Intl.DateTimeFormat('es-GT', {
            timeZone: 'America/Guatemala',
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        })
        const parts = formatter.formatToParts(today)
        const currentDay = parseInt(parts.find(p => p.type === 'day')?.value || '0')
        const currentMonth = parseInt(parts.find(p => p.type === 'month')?.value || '0')

        const { data, error } = await supabase
            .from('models')
            .select('id, alias, full_name, birth_date, cover_path, instagram')
            .not('birth_date', 'is', null)
            .eq('status', 'active')

        if (error) throw error

        const todayBirthdays = (data as BirthdayModel[]).filter(model => {
            const { month, day } = parseBirthDate(model.birth_date)
            return month === currentMonth && day === currentDay
        })

        return { success: true, data: todayBirthdays }
    } catch (error) {
        logError(error, { action: 'getTodayBirthdays' })
        return { success: false, error: 'Error al obtener cumpleaños de hoy' }
    }
}
