'use server'

import { createClient } from '@/lib/supabase/server'

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
 * @param month - Número del mes (1-12)
 */
export async function getBirthdaysByMonth(month: number): Promise<{ success: boolean; data?: BirthdayModel[]; error?: string }> {
    const supabase = await createClient()

    // Validar mes
    if (month < 1 || month > 12) {
        return { success: false, error: 'Mes inválido' }
    }

    const { data, error } = await supabase
        .from('models')
        .select('id, alias, full_name, birth_date, cover_path, instagram')
        .not('birth_date', 'is', null)
        .eq('status', 'active')

    if (error) {
        console.error('Error fetching birthdays:', error)
        return { success: false, error: 'Error al obtener cumpleaños' }
    }

    // Filtrar en JavaScript por mes (parseando directamente sin timezone)
    const filtered = (data as BirthdayModel[]).filter(model => {
        if (!model.birth_date) return false
        const { month: birthMonth } = parseBirthDate(model.birth_date)
        return birthMonth === month
    })

    // Ordenar por día del mes
    const sorted = filtered.sort((a, b) => {
        const { day: dayA } = parseBirthDate(a.birth_date)
        const { day: dayB } = parseBirthDate(b.birth_date)
        return dayA - dayB
    })

    return { success: true, data: sorted }
}

/**
 * Obtiene los modelos que cumplen años hoy
 */
export async function getTodayBirthdays(): Promise<{ success: boolean; data?: BirthdayModel[]; error?: string }> {
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

    console.log(`[Birthdays] Buscando cumpleaños de hoy: mes=${currentMonth}, día=${currentDay}`)

    const { data, error } = await supabase
        .from('models')
        .select('id, alias, full_name, birth_date, cover_path, instagram')
        .not('birth_date', 'is', null)
        .eq('status', 'active')

    if (error) {
        console.error('Error fetching today birthdays:', error)
        return { success: false, error: 'Error al obtener cumpleaños de hoy' }
    }

    // Filtrar modelos que cumplen años hoy (parseando directamente sin timezone)
    const todayBirthdays = (data as BirthdayModel[]).filter(model => {
        if (!model.birth_date) return false
        const { month: birthMonth, day: birthDay } = parseBirthDate(model.birth_date)
        const matches = birthMonth === currentMonth && birthDay === currentDay
        if (matches) {
            console.log(`[Birthdays] ¡Encontrado! ${model.alias || model.full_name} - ${model.birth_date}`)
        }
        return matches
    })

    console.log(`[Birthdays] Total cumpleañeros hoy: ${todayBirthdays.length}`)

    return { success: true, data: todayBirthdays }
}

