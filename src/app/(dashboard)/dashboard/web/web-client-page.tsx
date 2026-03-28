'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Globe, Layers, Loader2, Mars, Search, User, Venus, VenusAndMars, ChevronLeft, ChevronRight } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { toggleModelVisibility } from '@/lib/actions/models'
import { SegmentedControl } from '@/components/molecules/SegmentedControl'
import { FeaturedModelsPanel } from '@/components/organisms/FeaturedModelsPanel'
import { toPublicUrl } from '@/lib/utils'
import { SearchBar } from '@/components/molecules/SearchBar'
import type { WebModel } from '@/lib/actions/web'
import type { FeaturedModel } from '@/lib/actions/featured-models'

type GenderFilter = 'all' | 'female' | 'male'
type VisibilityFilter = 'all' | 'visible' | 'hidden'

interface WebVisibilityClientPageProps {
    initialModels: WebModel[]
    totalCount: number
    summary: {
        totalCount: number
        publicCount: number
    }
    currentPage: number
    totalPages: number
    initialQuery: string
    initialGender: GenderFilter
    initialVisibility: VisibilityFilter
    initialTopApprovedIds: string[]
    initialFeatured: FeaturedModel[]
    featuredCandidates: WebModel[]
    featuredCandidatesCount: number
    featuredCurrentPage: number
    featuredTotalPages: number
    initialFeaturedQuery: string
    initialFeaturedGender: GenderFilter
    initialFeaturedType: 'all' | 'starred'
    initialError: string | null
}

export default function WebVisibilityClientPage({
    initialModels,
    totalCount,
    summary,
    currentPage,
    totalPages,
    initialQuery,
    initialGender,
    initialVisibility,
    initialTopApprovedIds,
    initialFeatured,
    featuredCandidates,
    featuredCandidatesCount,
    featuredCurrentPage,
    featuredTotalPages,
    initialFeaturedQuery,
    initialFeaturedGender,
    initialFeaturedType,
    initialError,
}: WebVisibilityClientPageProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [models, setModels] = useState<WebModel[]>(initialModels)
    const [summaryState, setSummaryState] = useState(summary)
    const [search, setSearch] = useState(initialQuery)
    const [genderFilter, setGenderFilter] = useState<GenderFilter>(initialGender)
    const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>(initialVisibility)
    const [updating, setUpdating] = useState<string | null>(null)

    useEffect(() => {
        setModels(initialModels)
    }, [initialModels])

    useEffect(() => {
        setSummaryState(summary)
    }, [summary])

    useEffect(() => {
        setSearch(initialQuery)
    }, [initialQuery])

    useEffect(() => {
        setGenderFilter(initialGender)
    }, [initialGender])

    useEffect(() => {
        setVisibilityFilter(initialVisibility)
    }, [initialVisibility])

    useEffect(() => {
        if (initialError) {
            toast.error(initialError)
        }
    }, [initialError])

    const navigateWithParams = useCallback((update: (params: URLSearchParams) => void) => {
        const params = new URLSearchParams(searchParams.toString())
        update(params)
        router.push(`${pathname}?${params.toString()}`)
    }, [pathname, router, searchParams])

    const updateListParams = useCallback((next: { q?: string; gender?: GenderFilter; visibility?: VisibilityFilter; page?: number }) => {
        navigateWithParams((params) => {
            if (next.q !== undefined) {
                if (next.q.trim()) params.set('q', next.q.trim())
                else params.delete('q')
            }

            if (next.gender !== undefined) {
                if (next.gender === 'all') params.delete('gender')
                else params.set('gender', next.gender)
            }

            if (next.visibility !== undefined) {
                if (next.visibility === 'all') params.delete('visibility')
                else params.set('visibility', next.visibility)
            }

            if (next.page !== undefined) {
                if (next.page <= 1) params.delete('page')
                else params.set('page', String(next.page))
            }
        })
    }, [navigateWithParams])

    const handleToggle = async (modelId: string, newValue: boolean) => {
        setUpdating(modelId)
        const result = await toggleModelVisibility(modelId, newValue)
        if (result.success) {
            setModels(prev => prev.map(m => m.id === modelId ? { ...m, is_public: newValue } : m))
            setSummaryState(prev => ({
                ...prev,
                publicCount: prev.publicCount + (newValue ? 1 : -1),
            }))
            toast.success(newValue ? 'Visible en web' : 'Oculto de web')
        } else {
            toast.error(result.error || 'Error al actualizar')
        }
        setUpdating(null)
    }

    return (
        <div className="flex-1 min-h-0 overflow-y-auto grid gap-8 pb-6">
            {/* Header */}
            <header className="flex flex-col gap-x-4 gap-y-4 pb-4 border-b sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-display font-semibold">Visibilidad Web</h1>
                        <span aria-hidden className="h-5 w-px bg-border" />
                        <p className="text-label text-muted-foreground whitespace-nowrap">
                            {summaryState.publicCount} de {summaryState.totalCount} talentos visibles
                        </p>
                    </div>
                </div>
            </header>

            {/* Model list in Card with scroll */}
            <Card className="bg-sys-bg-secondary">
                <CardHeader className="py-6 border-b border-separator bg-quaternary rounded-t-lg">
                    <div className="flex flex-col gap-4">
                        {/* Title */}
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Globe className="h-5 w-5 text-primary" />
                            Talentos
                        </CardTitle>

                        {/* Search and Filters - Mobile: search top, filters bottom. Desktop: side by side */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <SearchBar
                                value={search}
                                onValueChange={setSearch}
                                onClear={() => {
                                    setSearch('')
                                    updateListParams({ q: '', page: 1 })
                                }}
                                onSubmit={(value) => updateListParams({ q: value, page: 1 })}
                                placeholder="Buscar talento..."
                                ariaLabel="Buscar talento"
                                className="w-full sm:w-64 shrink-0"
                            />

                            {/* Filters - Mobile: stack, Desktop: row */}
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                                <SegmentedControl<GenderFilter>
                                    ariaLabel="Filtrar por género"
                                    value={genderFilter}
                                    onValueChange={(value) => {
                                        setGenderFilter(value)
                                        updateListParams({ gender: value, page: 1 })
                                    }}
                                    className="w-fit shrink-0"
                                    options={[
                                        { value: 'all', label: 'Todos', iconOnly: true, icon: <VenusAndMars className="h-4 w-4" aria-hidden="true" /> },
                                        { value: 'female', label: 'Mujeres', iconOnly: true, icon: <Venus className="h-4 w-4" aria-hidden="true" /> },
                                        { value: 'male', label: 'Hombres', iconOnly: true, icon: <Mars className="h-4 w-4" aria-hidden="true" /> },
                                    ]}
                                />
                                <SegmentedControl<VisibilityFilter>
                                    ariaLabel="Filtrar por visibilidad"
                                    value={visibilityFilter}
                                    onValueChange={(value) => {
                                        setVisibilityFilter(value)
                                        updateListParams({ visibility: value, page: 1 })
                                    }}
                                    className="w-fit shrink-0"
                                    options={[
                                        { value: 'all', label: 'Todos', iconOnly: true, icon: <Layers className="h-4 w-4" aria-hidden="true" /> },
                                        { value: 'visible', label: 'Visibles', iconOnly: true, icon: <Eye className="h-4 w-4" aria-hidden="true" /> },
                                        { value: 'hidden', label: 'Ocultos', iconOnly: true, icon: <EyeOff className="h-4 w-4" aria-hidden="true" /> },
                                    ]}
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-4">

                    {/* Model grid with scroll */}
                    <ScrollArea className="h-100">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pr-4">
                            {models.length === 0 ? (
                                <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                                    <Globe className="h-12 w-12 mb-4 opacity-50" />
                                    <p className="text-body">No se encontraron talentos</p>
                                </div>
                            ) : (
                                models.map(model => (
                                    <div
                                        key={model.id}
                                        className="flex items-center gap-3 p-3 rounded-lg border-transparent bg-sys-bg-tertiary hover:bg-hover-overlay transition-colors"
                                    >
                                        <Avatar className="h-10 w-10 shrink-0">
                                            <AvatarImage src={toPublicUrl(model.cover_path) || undefined} />
                                            <AvatarFallback>
                                                <User className="h-5 w-5" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-body font-medium flex-1 truncate">
                                            {model.alias || model.full_name}
                                        </span>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {updating === model.id && (
                                                <Loader2 className="h-4 w-4 animate-spin text-purple" />
                                            )}
                                            <Switch
                                                checked={model.is_public}
                                                onCheckedChange={(checked) => handleToggle(model.id, checked)}
                                                disabled={updating === model.id}
                                                className="data-[state=unchecked]:bg-quaternary data-[state=checked]:bg-purple border-transparent [&>span]:data-[state=unchecked]:bg-tertiary [&>span]:data-[state=checked]:bg-white"
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>

                    {totalPages > 1 && (
                        <div className="mt-4 flex items-center justify-between gap-3 border-t border-separator pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={currentPage <= 1}
                                onClick={() => updateListParams({ page: currentPage - 1 })}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Anterior
                            </Button>
                            <span className="text-label text-muted-foreground text-center">
                                Página {currentPage} de {totalPages} · {totalCount} resultados
                            </span>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={currentPage >= totalPages}
                                onClick={() => updateListParams({ page: currentPage + 1 })}
                            >
                                Siguiente
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Featured Models Section */}
            <FeaturedModelsPanel
                initialFeatured={initialFeatured}
                candidateModels={featuredCandidates}
                candidateCount={featuredCandidatesCount}
                currentPage={featuredCurrentPage}
                totalPages={featuredTotalPages}
                initialQuery={initialFeaturedQuery}
                initialGender={initialFeaturedGender}
                initialType={initialFeaturedType}
                topApprovedModelIds={initialTopApprovedIds}
            />
        </div>
    )
}

