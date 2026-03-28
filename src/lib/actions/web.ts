'use server'

import { logger } from '@/lib/logger'
import { requireAuthenticatedAction } from '@/lib/actions/server-action-auth'

export interface WebModel {
    id: string
    alias: string | null
    full_name: string
    cover_path: string | null
    is_public: boolean
    gender: string | null
}

const WEB_VISIBILITY_PAGE_SIZE = 36
const FEATURED_CANDIDATE_PAGE_SIZE = 24

type WebVisibilityFilter = 'all' | 'visible' | 'hidden'
type WebGenderFilter = 'all' | 'female' | 'male'

interface WebVisibilityPageParams {
    query?: string
    gender?: WebGenderFilter
    visibility?: WebVisibilityFilter
    currentPage?: number
    limit?: number
}

interface FeaturedCandidateParams {
    query?: string
    gender?: WebGenderFilter
    onlyTopApproved?: boolean
    topApprovedModelIds?: string[]
    currentPage?: number
    limit?: number
}

function applyModelSearch(queryBuilder: any, query?: string) {
    if (!query) return queryBuilder

    const searchQuery = query
        .trim()
        .split(/\s+/)
        .filter((term) => term.length > 0)
        .map((term) => `${term}:*`)
        .join(' & ')

    if (!searchQuery) return queryBuilder

    return queryBuilder.textSearch('fts_search_vector', searchQuery, {
        config: 'spanish_unaccent',
    })
}

export async function getWebVisibilitySummary(): Promise<{ success: boolean; totalCount?: number; publicCount?: number; error?: string }> {
    const auth = await requireAuthenticatedAction()
    if (!auth.user) {
        return { success: false, error: auth.error }
    }

    const { supabase } = auth

    const [totalResult, publicResult] = await Promise.all([
        supabase.from('models').select('id', { count: 'exact', head: true }),
        supabase.from('models').select('id', { count: 'exact', head: true }).eq('is_public', true),
    ])

    if (totalResult.error || publicResult.error) {
        logger.fromError(totalResult.error || publicResult.error, { action: 'getWebVisibilitySummary' })
        return { success: false, error: 'Error al obtener resumen de visibilidad web' }
    }

    return {
        success: true,
        totalCount: totalResult.count ?? 0,
        publicCount: publicResult.count ?? 0,
    }
}

export async function getWebVisibilityPage(params: WebVisibilityPageParams): Promise<{ success: boolean; data?: WebModel[]; count?: number; error?: string }> {
    const auth = await requireAuthenticatedAction()
    if (!auth.user) {
        return { success: false, error: auth.error }
    }

    const { supabase } = auth
    const currentPage = Math.max(params.currentPage || 1, 1)
    const limit = params.limit || WEB_VISIBILITY_PAGE_SIZE

    let queryBuilder = supabase
        .from('models')
        .select('id, alias, full_name, cover_path, is_public, gender', { count: 'exact' })

    queryBuilder = applyModelSearch(queryBuilder, params.query)

    if (params.gender && params.gender !== 'all') {
        queryBuilder = queryBuilder.eq('gender', params.gender)
    }

    if (params.visibility === 'visible') {
        queryBuilder = queryBuilder.eq('is_public', true)
    } else if (params.visibility === 'hidden') {
        queryBuilder = queryBuilder.eq('is_public', false)
    }

    const from = (currentPage - 1) * limit
    const to = from + limit - 1
    const { data, error, count } = await queryBuilder
        .order('alias', { ascending: true, nullsFirst: false })
        .range(from, to)

    if (error) {
        logger.fromError(error, { action: 'getWebVisibilityPage', params })
        return { success: false, error: 'Error al obtener modelos' }
    }

    return { success: true, data: data as WebModel[], count: count ?? 0 }
}

export async function getFeaturedModelCandidates(params: FeaturedCandidateParams): Promise<{ success: boolean; data?: WebModel[]; count?: number; error?: string }> {
    const auth = await requireAuthenticatedAction()
    if (!auth.user) {
        return { success: false, error: auth.error }
    }

    const { supabase } = auth
    const currentPage = Math.max(params.currentPage || 1, 1)
    const limit = params.limit || FEATURED_CANDIDATE_PAGE_SIZE

    if (params.onlyTopApproved && (!params.topApprovedModelIds || params.topApprovedModelIds.length === 0)) {
        return { success: true, data: [], count: 0 }
    }

    let queryBuilder = supabase
        .from('models')
        .select('id, alias, full_name, cover_path, is_public, gender', { count: 'exact' })
        .eq('is_public', true)

    queryBuilder = applyModelSearch(queryBuilder, params.query)

    if (params.gender && params.gender !== 'all') {
        queryBuilder = queryBuilder.eq('gender', params.gender)
    }

    if (params.onlyTopApproved && params.topApprovedModelIds) {
        queryBuilder = queryBuilder.in('id', params.topApprovedModelIds)
    }

    const from = (currentPage - 1) * limit
    const to = from + limit - 1
    const { data, error, count } = await queryBuilder
        .order('alias', { ascending: true, nullsFirst: false })
        .range(from, to)

    if (error) {
        logger.fromError(error, { action: 'getFeaturedModelCandidates', params })
        return { success: false, error: 'Error al obtener candidatos para destacados' }
    }

    return { success: true, data: data as WebModel[], count: count ?? 0 }
}

/**
 * Obtiene todos los modelos para la gestión de visibilidad web
 */
export async function getAllModelsForWeb(): Promise<{ success: boolean; data?: WebModel[]; error?: string }> {
    const auth = await requireAuthenticatedAction()
    if (!auth.user) {
        return { success: false, error: auth.error }
    }

    const { supabase } = auth

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
