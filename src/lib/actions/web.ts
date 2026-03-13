'use server'

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export interface WebModel {
    id: string
    alias: string | null
    full_name: string
    cover_path: string | null
    is_public: boolean
    gender: string | null
}

/**
 * Obtiene todos los modelos para la gestión de visibilidad web
 */
export async function getAllModelsForWeb(): Promise<{ success: boolean; data?: WebModel[]; error?: string }> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('models')
        .select('id, alias, full_name, cover_path, is_public, gender')
        .order('alias', { ascending: true, nullsFirst: false })

    if (error) {
        logger.fromError(error, { action: 'getAllModelsForWeb' })
        return { success: false, error: 'Error al obtener modelos' }
    }

    logger.info('Models fetched for web', { count: data?.length ?? 0 })

    return { success: true, data: data as WebModel[] }
}
