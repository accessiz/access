'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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

export async function getFeaturedModels(): Promise<{ success: boolean; data?: FeaturedModel[]; error?: string }> {
    try {
        const supabase = await createClient()

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
            console.error('[getFeaturedModels] Error:', error)
            return { success: false, error: error.message }
        }

        return { success: true, data: data as FeaturedModel[] }
    } catch (err) {
        console.error('[getFeaturedModels] Exception:', err)
        return { success: false, error: 'Error al obtener modelos destacados' }
    }
}

export async function addFeaturedModel(modelId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient()

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
        console.error('[addFeaturedModel] Exception:', err)
        return { success: false, error: 'Error al agregar modelo destacado' }
    }
}

export async function removeFeaturedModel(modelId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient()

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
        console.error('[removeFeaturedModel] Exception:', err)
        return { success: false, error: 'Error al quitar modelo destacado' }
    }
}

export async function reorderFeaturedModels(orderedModelIds: string[]): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient()

        // Update positions in a transaction-like manner
        for (let i = 0; i < orderedModelIds.length; i++) {
            const { error } = await supabase
                .from('featured_web_models')
                .update({ position: i })
                .eq('model_id', orderedModelIds[i])

            if (error) {
                return { success: false, error: error.message }
            }
        }

        revalidatePath('/dashboard/web')
        return { success: true }
    } catch (err) {
        console.error('[reorderFeaturedModels] Exception:', err)
        return { success: false, error: 'Error al reordenar modelos' }
    }
}
