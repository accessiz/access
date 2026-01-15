'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff, Globe, Layers, Loader2, Mars, Search, User, Venus, VenusAndMars } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { toggleModelVisibility } from '@/lib/actions/models'
import { getAllModelsForWeb } from '@/lib/actions/web'
import { getTopApprovedModelIds } from '@/lib/actions/rankings'
import { SegmentedControl } from '@/components/molecules/SegmentedControl'
import { FeaturedModelsPanel } from '@/components/organisms/FeaturedModelsPanel'

type Model = {
    id: string
    alias: string | null
    full_name: string
    cover_path: string | null
    is_public: boolean
    gender: string | null
}

type GenderFilter = 'all' | 'female' | 'male'
type VisibilityFilter = 'all' | 'visible' | 'hidden'

function mediaUrl(path: string | null): string | null {
    if (!path) return null
    return `/api/media/${path}`
}

export default function WebVisibilityClientPage() {
    const [models, setModels] = useState<Model[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [genderFilter, setGenderFilter] = useState<GenderFilter>('all')
    const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('all')
    const [updating, setUpdating] = useState<string | null>(null)
    const [topApprovedIds, setTopApprovedIds] = useState<string[]>([])

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch models
                const result = await getAllModelsForWeb()
                if (result.success && result.data) {
                    setModels(result.data)
                } else {
                    toast.error(result.error || 'Error al cargar modelos')
                }

                // Fetch top approved models
                const topIds = await getTopApprovedModelIds(20)
                setTopApprovedIds(topIds)
            } catch (err) {
                console.error(err)
                toast.error('Error al cargar modelos')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const handleToggle = async (modelId: string, newValue: boolean) => {
        setUpdating(modelId)
        const result = await toggleModelVisibility(modelId, newValue)
        if (result.success) {
            setModels(prev => prev.map(m =>
                m.id === modelId ? { ...m, is_public: newValue } : m
            ))
            toast.success(newValue ? 'Visible en web' : 'Oculto de web')
        } else {
            toast.error(result.error || 'Error al actualizar')
        }
        setUpdating(null)
    }

    const filteredModels = models.filter(m => {
        const name = (m.alias || m.full_name).toLowerCase()
        const matchesSearch = name.includes(search.toLowerCase())
        const matchesGender = genderFilter === 'all' ||
            (genderFilter === 'female' && m.gender?.toLowerCase() === 'female') ||
            (genderFilter === 'male' && m.gender?.toLowerCase() === 'male')
        const matchesVisibility = visibilityFilter === 'all' ||
            (visibilityFilter === 'visible' && m.is_public) ||
            (visibilityFilter === 'hidden' && !m.is_public)
        return matchesSearch && matchesGender && matchesVisibility
    })

    const publicCount = models.filter(m => m.is_public).length

    return (
        <div className="grid gap-8">
            {/* Header */}
            <header className="flex flex-col gap-x-4 gap-y-4 pb-4 border-b sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-display font-semibold">Visibilidad Web</h1>
                        <span aria-hidden className="h-5 w-px bg-border" />
                        <p className="text-label text-muted-foreground whitespace-nowrap">
                            {publicCount} de {models.length} talentos visibles
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

                            {/* Filters - Mobile: stack, Desktop: row */}
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
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
                                <SegmentedControl<VisibilityFilter>
                                    ariaLabel="Filtrar por visibilidad"
                                    value={visibilityFilter}
                                    onValueChange={setVisibilityFilter}
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
                    <ScrollArea className="h-[400px]">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pr-4">
                            {loading ? (
                                Array.from({ length: 9 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-4 p-3 rounded-lg border">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <Skeleton className="h-4 w-24 flex-1" />
                                        <Skeleton className="h-6 w-10" />
                                    </div>
                                ))
                            ) : filteredModels.length === 0 ? (
                                <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                                    <Globe className="h-12 w-12 mb-4 opacity-50" />
                                    <p className="text-body">No se encontraron talentos</p>
                                </div>
                            ) : (
                                filteredModels.map(model => (
                                    <div
                                        key={model.id}
                                        className="flex items-center gap-3 p-3 rounded-lg border-transparent bg-sys-bg-tertiary hover:bg-hover-overlay transition-colors"
                                    >
                                        <Avatar className="h-10 w-10 shrink-0">
                                            <AvatarImage src={mediaUrl(model.cover_path) || undefined} />
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
                </CardContent>
            </Card>

            {/* Featured Models Section */}
            <FeaturedModelsPanel allModels={models} topApprovedModelIds={topApprovedIds} />
        </div>
    )
}

