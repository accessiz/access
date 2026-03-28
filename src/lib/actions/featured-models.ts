'use server'

import { revalidatePath } from 'next/cache'
import { logError } from '@/lib/utils/errors'
import { requireAuthenticatedAction } from '@/lib/actions/server-action-auth'

const MAX_FEATURED_MODELS = 8

export type FeaturedModel = {
    id: string
    model_id: string
    position: number
    models: {
        id: string
        alias: string | null
        full_name: string
        cover_path: string | null
    }
}

type FeaturedModelRow = {
    id: string
    model_id: string
    position: number
    models: FeaturedModel['models'] | FeaturedModel['models'][] | null
}

export async function getFeaturedModels(): Promise<{ success: boolean; data?: FeaturedModel[]; error?: string }> {
    try {
        const auth = await requireAuthenticatedAction()
        if (!auth.user) {
            return { success: false, error: auth.error }
        }

        const { supabase } = auth

        const { data, error } = await supabase
            .from('featured_web_models')
            .select(`
        id,
        model_id,
        position,
        models (
          id,
          alias,
          full_name,
          cover_path
        )
      `)
            .order('position', { ascending: true })

        if (error) {
            logError(error, { action: 'getFeaturedModels' })
            return { success: false, error: error.message }
        }

        const normalizedData = ((data ?? []) as FeaturedModelRow[]).flatMap((item) => {
            const model = Array.isArray(item.models) ? item.models[0] : item.models
            if (!model) {
                return []
            }

            return [{
                id: item.id,
                model_id: item.model_id,
                position: item.position,
                models: model,
            }]
        })

        return { success: true, data: normalizedData }
    } catch (err) {
        logError(err, { action: 'getFeaturedModels.catch_all' })
        return { success: false, error: 'Error al obtener modelos destacados' }
    }
}

export async function addFeaturedModel(modelId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const auth = await requireAuthenticatedAction()
        if (!auth.user) {
            return { success: false, error: auth.error }
        }

        const { supabase } = auth

        // Check current count
        const { count, error: countError } = await supabase
            .from('featured_web_models')
            .select('*', { count: 'exact', head: true })

        if (countError) {
            return { success: false, error: countError.message }
        }

        if (count && count >= MAX_FEATURED_MODELS) {
            return { success: false, error: `Máximo ${MAX_FEATURED_MODELS} modelos destacados permitidos` }
        }

        // Get next position
        const { data: lastItem } = await supabase
            .from('featured_web_models')
            .select('position')
            .order('position', { ascending: false })
            .limit(1)
            .single()

        const nextPosition = lastItem ? lastItem.position + 1 : 0

        // Insert
        const { error: insertError } = await supabase
            .from('featured_web_models')
            .insert({ model_id: modelId, position: nextPosition })

        if (insertError) {
            if (insertError.code === '23505') {
                return { success: false, error: 'Este modelo ya está destacado' }
            }
            return { success: false, error: insertError.message }
        }

        revalidatePath('/dashboard/web')
        return { success: true }
    } catch (err) {
        logError(err, { action: 'addFeaturedModel' })
        return { success: false, error: 'Error al agregar modelo destacado' }
    }
}

export async function removeFeaturedModel(modelId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const auth = await requireAuthenticatedAction()
        if (!auth.user) {
            return { success: false, error: auth.error }
        }

        const { supabase } = auth

        const { error } = await supabase
            .from('featured_web_models')
            .delete()
            .eq('model_id', modelId)

        if (error) {
            return { success: false, error: error.message }
        }

        revalidatePath('/dashboard/web')
        return { success: true }
    } catch (err) {
        logError(err, { action: 'removeFeaturedModel' })
        return { success: false, error: 'Error al quitar modelo destacado' }
    }
}

export async function reorderFeaturedModels(orderedModelIds: string[]): Promise<{ success: boolean; error?: string }> {
    try {
        const auth = await requireAuthenticatedAction()
        if (!auth.user) {
            return { success: false, error: auth.error }
        }

        const { supabase } = auth

        const updates = orderedModelIds.map((modelId, index) =>
            supabase
                .from('featured_web_models')
                .update({ position: index })
                .eq('model_id', modelId)
        )

        const results = await Promise.all(updates)
        const failedUpdate = results.find(result => result.error)
        if (failedUpdate?.error) {
            return { success: false, error: failedUpdate.error.message }
        }

        revalidatePath('/dashboard/web')
        return { success: true }
    } catch (err) {
        logError(err, { action: 'reorderFeaturedModels' })
        return { success: false, error: 'Error al reordenar modelos' }
    }
}
