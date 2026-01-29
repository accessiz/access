'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Plus, X, Star, Search, Loader2, User, Layers, Venus, Mars, VenusAndMars } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { getFeaturedModels, addFeaturedModel, removeFeaturedModel, FeaturedModel } from '@/lib/actions/featured-models'
import { cn } from '@/lib/utils'
import { SegmentedControl } from '@/components/molecules/SegmentedControl'
import { R2_PUBLIC_URL } from '@/lib/constants'

type Model = {
    id: string
    alias: string | null
    full_name: string
    cover_path: string | null
    is_public: boolean
    gender: string | null
}

type ModelFilter = 'all' | 'starred'
type GenderFilter = 'all' | 'female' | 'male'

interface FeaturedModelsPanelProps {
    allModels: Model[]
    topApprovedModelIds?: string[]
    className?: string
}

// CORS habilitado en R2 - servir directamente sin proxy
function mediaUrl(path: string | null): string | null {
    if (!path || !R2_PUBLIC_URL) return null
    return `${R2_PUBLIC_URL}/${path}`
}

export function FeaturedModelsPanel({ allModels, topApprovedModelIds = [], className }: FeaturedModelsPanelProps) {
    const [featured, setFeatured] = useState<FeaturedModel[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [modelFilter, setModelFilter] = useState<ModelFilter>('all')
    const [genderFilter, setGenderFilter] = useState<GenderFilter>('all')
    const [adding, setAdding] = useState<string | null>(null)
    const [removing, setRemoving] = useState<string | null>(null)

    const topApprovedSet = useMemo(() => new Set(topApprovedModelIds), [topApprovedModelIds])

    useEffect(() => {
        const fetchFeatured = async () => {
            const result = await getFeaturedModels()
            if (result.success && result.data) {
                setFeatured(result.data)
            }
            setLoading(false)
        }
        fetchFeatured()
    }, [])

    const featuredIds = useMemo(() => new Set(featured.map(f => f.model_id)), [featured])

    // Only show public models (is_public = true) that are not already featured
    const availableModels = useMemo(() => {
        return allModels
            .filter(m => m.is_public) // Only public models can be featured
            .filter(m => !featuredIds.has(m.id))
            .filter(m => {
                if (modelFilter === 'starred') {
                    return topApprovedSet.has(m.id)
                }
                return true
            })
            .filter(m => {
                if (genderFilter === 'female') return m.gender?.toLowerCase() === 'female'
                if (genderFilter === 'male') return m.gender?.toLowerCase() === 'male'
                return true
            })
            .filter(m => {
                if (!search.trim()) return true
                const name = (m.alias || m.full_name).toLowerCase()
                return name.includes(search.toLowerCase())
            })
    }, [allModels, featuredIds, search, modelFilter, genderFilter, topApprovedSet])

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
                            {/* Search */}
                            <div className="relative w-full sm:w-64 shrink-0">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar talento..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>

                            {/* Filters - Gender + Star */}
                            <div className="flex items-center gap-2">
                                <SegmentedControl<GenderFilter>
                                    ariaLabel="Filtrar por género"
                                    value={genderFilter}
                                    onValueChange={setGenderFilter}
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
                                    onValueChange={setModelFilter}
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
                    <ScrollArea className="h-[350px]">
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
                                            <AvatarImage src={mediaUrl(model.cover_path) || undefined} />
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
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
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
                    {loading ? (
                        <div className="divide-y divide-separator">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3 p-4 w-full">
                                    <Skeleton className="h-4 w-4" />
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <Skeleton className="h-4 flex-1" />
                                    <Skeleton className="h-8 w-8" />
                                </div>
                            ))}
                        </div>
                    ) : featured.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                            <Star className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p className="text-body">No hay modelos destacados</p>
                            <p className="text-label mt-1">Agrega modelos desde la búsqueda</p>
                        </div>
                    ) : (
                        <ScrollArea className="h-[350px]">
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
                                            <AvatarImage src={mediaUrl(item.models?.cover_path) || undefined} />
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
