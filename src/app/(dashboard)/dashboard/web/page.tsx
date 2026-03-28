import WebVisibilityClientPage from './web-client-page'
import {
    getFeaturedModelCandidates,
    getWebVisibilityPage,
    getWebVisibilitySummary,
} from '@/lib/actions/web'
import { getTopApprovedModelIds } from '@/lib/actions/rankings'
import { getFeaturedModels } from '@/lib/actions/featured-models'

const WEB_VISIBILITY_PAGE_SIZE = 36
const FEATURED_CANDIDATE_PAGE_SIZE = 24

type PageProps = {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export const metadata = {
    title: 'Visibilidad Web | NYXA ACCESS',
}

export default async function WebPage({ searchParams }: PageProps) {
    const resolvedSearchParams = await searchParams
    const query = typeof resolvedSearchParams.q === 'string' ? resolvedSearchParams.q : undefined
    const gender = resolvedSearchParams.gender === 'female' || resolvedSearchParams.gender === 'male'
        ? resolvedSearchParams.gender
        : 'all'
    const visibility = resolvedSearchParams.visibility === 'visible' || resolvedSearchParams.visibility === 'hidden'
        ? resolvedSearchParams.visibility
        : 'all'
    const pageParam = typeof resolvedSearchParams.page === 'string' ? Number(resolvedSearchParams.page) : 1
    const currentPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1

    const featuredQuery = typeof resolvedSearchParams.fq === 'string' ? resolvedSearchParams.fq : undefined
    const featuredGender = resolvedSearchParams.fg === 'female' || resolvedSearchParams.fg === 'male'
        ? resolvedSearchParams.fg
        : 'all'
    const featuredType = resolvedSearchParams.ft === 'starred' ? 'starred' : 'all'
    const featuredPageParam = typeof resolvedSearchParams.fp === 'string' ? Number(resolvedSearchParams.fp) : 1
    const featuredPage = Number.isFinite(featuredPageParam) && featuredPageParam > 0 ? featuredPageParam : 1

    const [topApprovedModelIds, featuredModelsResult, summaryResult] = await Promise.all([
        getTopApprovedModelIds(20),
        getFeaturedModels(),
        getWebVisibilitySummary(),
    ])

    const [modelsResult, featuredCandidatesResult] = await Promise.all([
        getWebVisibilityPage({
            query,
            gender,
            visibility,
            currentPage,
            limit: WEB_VISIBILITY_PAGE_SIZE,
        }),
        getFeaturedModelCandidates({
            query: featuredQuery,
            gender: featuredGender,
            onlyTopApproved: featuredType === 'starred',
            topApprovedModelIds,
            currentPage: featuredPage,
            limit: FEATURED_CANDIDATE_PAGE_SIZE,
        }),
    ])

    return (
        <WebVisibilityClientPage
            initialModels={modelsResult.success ? modelsResult.data ?? [] : []}
            totalCount={modelsResult.success ? modelsResult.count ?? 0 : 0}
            summary={summaryResult.success
                ? { totalCount: summaryResult.totalCount ?? 0, publicCount: summaryResult.publicCount ?? 0 }
                : { totalCount: 0, publicCount: 0 }}
            currentPage={currentPage}
            totalPages={Math.max(1, Math.ceil((modelsResult.success ? modelsResult.count ?? 0 : 0) / WEB_VISIBILITY_PAGE_SIZE))}
            initialQuery={query ?? ''}
            initialGender={gender}
            initialVisibility={visibility}
            initialTopApprovedIds={topApprovedModelIds}
            initialFeatured={featuredModelsResult.success ? featuredModelsResult.data ?? [] : []}
            featuredCandidates={featuredCandidatesResult.success ? featuredCandidatesResult.data ?? [] : []}
            featuredCandidatesCount={featuredCandidatesResult.success ? featuredCandidatesResult.count ?? 0 : 0}
            featuredCurrentPage={featuredPage}
            featuredTotalPages={Math.max(1, Math.ceil((featuredCandidatesResult.success ? featuredCandidatesResult.count ?? 0 : 0) / FEATURED_CANDIDATE_PAGE_SIZE))}
            initialFeaturedQuery={featuredQuery ?? ''}
            initialFeaturedGender={featuredGender}
            initialFeaturedType={featuredType}
            initialError={modelsResult.success ? null : modelsResult.error ?? 'Error al cargar modelos'}
        />
    )
}
