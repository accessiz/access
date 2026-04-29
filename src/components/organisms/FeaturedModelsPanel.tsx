'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { Plus, X, Star, Search, Loader2, User, Layers, Venus, Mars, VenusAndMars, ChevronLeft, ChevronRight } from 'lucide-react'
import { getFeaturedModels, addFeaturedModel, removeFeaturedModel, FeaturedModel } from '@/lib/actions/featured-models'
import { cn, toPublicUrl } from '@/lib/utils'
import { SegmentedControl } from '@/components/molecules/SegmentedControl'
import { SearchBar } from '@/components/molecules/SearchBar'
import type { WebModel } from '@/lib/actions/web'

type ModelFilter = 'all' | 'starred'
type GenderFilter = 'all' | 'female' | 'male'

interface FeaturedModelsPanelProps {
    initialFeatured: FeaturedModel[]
    candidateModels: WebModel[]
    candidateCount: number
    currentPage: number
    totalPages: number
    initialQuery: string
    initialGender: GenderFilter
    initialType: ModelFilter
    topApprovedModelIds?: string[]
    className?: string
}

export function FeaturedModelsPanel({
    initialFeatured,
    candidateModels,
    candidateCount,
    currentPage,
    totalPages,
    initialQuery,
    initialGender,
    initialType,
    topApprovedModelIds = [],
    className,
}: FeaturedModelsPanelProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [featured, setFeatured] = useState<FeaturedModel[]>(initialFeatured)
    const [search, setSearch] = useState(initialQuery)
    const [modelFilter, setModelFilter] = useState<ModelFilter>(initialType)
    const [genderFilter, setGenderFilter] = useState<GenderFilter>(initialGender)
    const [adding, setAdding] = useState<string | null>(null)
    const [removing, setRemoving] = useState<string | null>(null)

    const topApprovedSet = useMemo(() => new Set(topApprovedModelIds), [topApprovedModelIds])

    useEffect(() => {
        setFeatured(initialFeatured)
    }, [initialFeatured])

    useEffect(() => {
        setSearch(initialQuery)
    }, [initialQuery])

    useEffect(() => {
        setGenderFilter(initialGender)
    }, [initialGender])

    useEffect(() => {
        setModelFilter(initialType)
    }, [initialType])

    const navigateWithParams = useCallback((update: (params: URLSearchParams) => void) => {
        const params = new URLSearchParams(searchParams.toString())
        update(params)
        router.push(`${pathname}?${params.toString()}`)
    }, [pathname, router, searchParams])

    const updateFeaturedParams = useCallback((next: { q?: string; gender?: GenderFilter; type?: ModelFilter; page?: number }) => {
        navigateWithParams((params) => {
            if (next.q !== undefined) {
                if (next.q.trim()) params.set('fq', next.q.trim())
                else params.delete('fq')
            }

            if (next.gender !== undefined) {
                if (next.gender === 'all') params.delete('fg')
                else params.set('fg', next.gender)
            }

            if (next.type !== undefined) {
                if (next.type === 'all') params.delete('ft')
                else params.set('ft', next.type)
            }

            if (next.page !== undefined) {
                if (next.page <= 1) params.delete('fp')
                else params.set('fp', String(next.page))
            }
        })
    }, [navigateWithParams])

    const handleFeaturedSearchDebounced = useDebouncedCallback((value: string) => {
        updateFeaturedParams({ q: value, page: 1 })
    }, 300)

    const featuredIds = useMemo(() => new Set(featured.map(f => f.model_id)), [featured])

    const availableModels = candidateModels

    const handleAdd = async (modelId: string) => {
        if (featured.length >= 8) {
            toast.error('Máximo 8 modelos destacados')
            return
        }

        setAdding(modelId)
        const result = await addFeaturedModel(modelId)

        if (result.success) {
            const updated = await getFeaturedModels()
            if (updated.success && updated.data) {
                setFeatured(updated.data)
            }
            toast.success('Modelo agregado a destacados')
        } else {
            toast.error(result.error || 'Error al agregar')
        }
        setAdding(null)
    }

    const handleRemove = async (modelId: string) => {
        setRemoving(modelId)
        const result = await removeFeaturedModel(modelId)

        if (result.success) {
            setFeatured(prev => prev.filter(f => f.model_id !== modelId))
            toast.success('Modelo removido de destacados')
        } else {
            toast.error(result.error || 'Error al remover')
        }
        setRemoving(null)
    }

    return (
        <div className={cn("grid gap-6 lg:grid-cols-2", className)}>
            {/* Left: Search and available models */}
            <Card className="bg-sys-bg-secondary">
                <CardHeader className="py-6 border-b border-separator bg-quaternary rounded-t-lg">
                    <div className="flex flex-col gap-4">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Search className="h-5 w-5 text-primary" />
                            Seleccionar Talentos
                        </CardTitle>

                        {/* Search and filters */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <SearchBar
                                value={search}
                                onValueChange={(val) => {
                                    setSearch(val);
                                    handleFeaturedSearchDebounced(val);
                                }}
                                onClear={() => {
                                    setSearch('')
                                    updateFeaturedParams({ q: '', page: 1 })
                                }}
                                onSubmit={(value) => updateFeaturedParams({ q: value, page: 1 })}
                                placeholder="Buscar talento..."
                                ariaLabel="Buscar talento para destacados"
                                className="w-full sm:w-64 shrink-0"
                            />

                            {/* Filters - Gender + Star */}
                            <div className="flex items-center gap-2">
                                <SegmentedControl<GenderFilter>
                                    ariaLabel="Filtrar por género"
                                    value={genderFilter}
                                    onValueChange={(value) => {
                                        setGenderFilter(value)
                                        updateFeaturedParams({ gender: value, page: 1 })
                                    }}
                                    className="w-fit shrink-0"
                                    options={[
                                        { value: 'all', label: 'Todos', iconOnly: true, icon: <VenusAndMars className="h-4 w-4" aria-hidden="true" /> },
                                        { value: 'female', label: 'Mujeres', iconOnly: true, icon: <Venus className="h-4 w-4" aria-hidden="true" /> },
                                        { value: 'male', label: 'Hombres', iconOnly: true, icon: <Mars className="h-4 w-4" aria-hidden="true" /> },
                                    ]}
                                />
                                <SegmentedControl<ModelFilter>
                                    ariaLabel="Filtrar top"
                                    value={modelFilter}
                                    onValueChange={(value) => {
                                        setModelFilter(value)
                                        updateFeaturedParams({ type: value, page: 1 })
                                    }}
                                    className="w-fit shrink-0"
                                    options={[
                                        { value: 'all', label: 'Todos', iconOnly: true, icon: <Layers className="h-4 w-4" aria-hidden="true" /> },
                                        { value: 'starred', label: 'Top 20', iconOnly: true, icon: <Star className="h-4 w-4" aria-hidden="true" /> },
                                    ]}
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-87.5">
                        <div className="divide-y divide-separator">
                            {availableModels.length === 0 ? (
                                <div className="py-8 text-center text-muted-foreground">
                                    <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-body">No hay talentos disponibles</p>
                                </div>
                            ) : (
                                availableModels.map(model => (
                                    <div
                                        key={model.id}
                                        className="flex items-center gap-3 p-4 hover:bg-hover-overlay transition-colors w-full"
                                    >
                                        <Avatar className="h-10 w-10 shrink-0">
                                            <AvatarImage src={toPublicUrl(model.cover_path) || undefined} />
                                            <AvatarFallback>
                                                <User className="h-5 w-5" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-body font-medium flex-1 truncate min-w-0">
                                            {model.alias || model.full_name}
                                        </span>

                                        {topApprovedSet.has(model.id) && (
                                            <Star className="h-4 w-4 text-warning fill-warning shrink-0" />
                                        )}

                                        {featuredIds.has(model.id) ? (
                                            <div className="h-8 w-8 rounded-full bg-purple flex items-center justify-center shrink-0">
                                                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleAdd(model.id)}
                                                disabled={adding === model.id || featured.length >= 8}
                                                className="shrink-0 h-8 w-8 p-0 hover:bg-success/20 hover:text-success"
                                            >
                                                {adding === model.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Plus className="h-4 w-4" />
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>

                    {totalPages > 1 && (
                        <div className="border-t border-separator p-4">
                            <div className="flex items-center justify-between gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage <= 1}
                                    onClick={() => updateFeaturedParams({ page: currentPage - 1 })}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Anterior
                                </Button>
                                <span className="text-label text-muted-foreground text-center">
                                    Página {currentPage} de {totalPages} · {candidateCount} resultados
                                </span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage >= totalPages}
                                    onClick={() => updateFeaturedParams({ page: currentPage + 1 })}
                                >
                                    Siguiente
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Right: Featured models list */}
            <Card className="bg-sys-bg-secondary">
                <CardHeader className="py-6 border-b border-separator bg-quaternary rounded-t-lg">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Star className="h-5 w-5 text-primary" />
                        Modelos Destacados
                        <span className="text-muted-foreground font-normal text-body ml-auto">
                            {featured.length}/8
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {featured.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                            <Star className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p className="text-body">No hay modelos destacados</p>
                            <p className="text-label mt-1">Agrega modelos desde la búsqueda</p>
                        </div>
                    ) : (
                        <ScrollArea className="h-87.5">
                            <div className="divide-y divide-separator">
                                {featured.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-3 p-4 hover:bg-hover-overlay transition-colors group w-full"
                                    >
                                        <span className="text-label text-muted-foreground w-5 text-center shrink-0">
                                            {index + 1}
                                        </span>

                                        <Avatar className="h-10 w-10 shrink-0">
                                            <AvatarImage src={toPublicUrl(item.models?.cover_path) || undefined} />
                                            <AvatarFallback>
                                                <User className="h-5 w-5" />
                                            </AvatarFallback>
                                        </Avatar>

                                        <span className="text-body font-medium flex-1 truncate min-w-0">
                                            {item.models?.alias || item.models?.full_name || 'Sin nombre'}
                                        </span>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <div className="h-8 w-8 rounded-full bg-purple flex items-center justify-center">
                                                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>

                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleRemove(item.model_id)}
                                                disabled={removing === item.model_id}
                                                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                                            >
                                                {removing === item.model_id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <X className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
