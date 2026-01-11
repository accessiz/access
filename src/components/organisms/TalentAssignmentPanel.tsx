'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import {
    Check, Loader2, Save, CheckCircle2,
    Search, Filter, X, Users, Calendar, CheckCheck,
    ThumbsUp, ThumbsDown
} from 'lucide-react'
import { Model, Project } from '@/lib/types'
import { assignModelToSchedule, unassignModelFromSchedule, removeModelFromProject, updateModelSelection } from '@/lib/actions/projects_models'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ProjectStatusBadge } from '@/components/molecules/ProjectStatusBadge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { SUPABASE_PUBLIC_URL } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { SearchBar } from '@/components/molecules/SearchBar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TalentAssignmentPanelProps {
    project: Project
    models: Model[]
    onAssignmentChange?: (modelId: string, scheduleId: string, assigned: boolean) => void
    onModelRemoved?: (modelId: string) => void
    onSelectionChange?: (modelId: string, status: Model['client_selection']) => void
    onRefresh?: () => void
}

interface PendingChange {
    modelId: string
    scheduleId: string
    assigned: boolean
    status: 'pending' | 'saving' | 'saved' | 'error'
}

type GenderFilter = 'all' | 'male' | 'female'
type AvailabilityFilter = 'all' | 'all_dates' | 'any_date' | 'no_dates'
type StatusFilter = 'all' | 'approved' | 'pending' | 'rejected'

const formatScheduleDate = (dateStr: string) => {
    const date = new Date(`${dateStr}T00:00:00`)
    return {
        dayName: date.toLocaleDateString('es-ES', { weekday: 'short' }),
        dayNumber: date.getDate(),
        month: date.toLocaleDateString('es-ES', { month: 'short' }),
        fullDate: date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }),
    }
}

const DEBOUNCE_MS = 800

export function TalentAssignmentPanel({
    project,
    models,
    onAssignmentChange,
    onModelRemoved,
    onSelectionChange,
    onRefresh,
}: TalentAssignmentPanelProps) {
    // Estados de búsqueda y filtros
    const [searchQuery, setSearchQuery] = useState('')
    const [genderFilter, setGenderFilter] = useState<GenderFilter>('all')
    const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('all')
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
    const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null)

    // Estados de asignaciones
    const [localAssignments, setLocalAssignments] = useState<Record<string, Set<string>>>({})
    const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([])
    const [isSaving, setIsSaving] = useState(false)
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
    const changesQueueRef = useRef<PendingChange[]>([])

    // Estado para eliminar modelo
    const [removingModelId, setRemovingModelId] = useState<string | null>(null)

    // Ordenar schedule por fecha+hora
    const sortedSchedule = useMemo(() => {
        if (!project.schedule) return []
        return [...project.schedule]
            .filter(s => s.id)
            .sort((a, b) => {
                const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime()
                if (dateCompare !== 0) return dateCompare
                return a.startTime.localeCompare(b.startTime)
            })
    }, [project.schedule])

    // Detectar qué fechas tienen múltiples horarios
    const datesWithMultipleSlots = useMemo(() => {
        const dateCounts: Record<string, number> = {}
        sortedSchedule.forEach(s => {
            dateCounts[s.date] = (dateCounts[s.date] || 0) + 1
        })
        return new Set(Object.entries(dateCounts).filter(([, count]) => count > 1).map(([date]) => date))
    }, [sortedSchedule])

    // Inicializar asignaciones locales desde los modelos
    // Si solo hay 1 fecha, auto-asignar todos los modelos
    useEffect(() => {
        const initial: Record<string, Set<string>> = {}
        const scheduleIds = sortedSchedule.map(s => s.id!)
        const isSingleDate = scheduleIds.length === 1

        models.forEach(model => {
            const existingAssignments = model.assignments?.map(a => a.schedule_id).filter(Boolean) as string[] || []

            if (isSingleDate && existingAssignments.length === 0) {
                // Auto-asignar si es 1 sola fecha y no tiene asignaciones
                initial[model.id] = new Set(scheduleIds)
            } else {
                initial[model.id] = new Set(existingAssignments)
            }
        })
        setLocalAssignments(initial)
    }, [models, sortedSchedule])

    // Filtrar modelos según búsqueda y filtros
    const filteredModels = useMemo(() => {
        let result = [...models]

        // Búsqueda por nombre/alias
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            result = result.filter(m =>
                m.alias?.toLowerCase().includes(query)
            )
        }

        // Filtro por género (case-insensitive)
        if (genderFilter !== 'all') {
            result = result.filter(m => m.gender?.toLowerCase() === genderFilter)
        }

        // Filtro por estado de selección
        if (statusFilter !== 'all') {
            result = result.filter(m => m.client_selection === statusFilter)
        }

        // Filtro por disponibilidad
        if (availabilityFilter !== 'all' && sortedSchedule.length > 0) {
            const scheduleIds = new Set(sortedSchedule.map(s => s.id!))

            result = result.filter(m => {
                const modelAssignments = localAssignments[m.id] || new Set()
                const assignedCount = [...modelAssignments].filter(id => scheduleIds.has(id)).length

                switch (availabilityFilter) {
                    case 'all_dates':
                        return assignedCount === scheduleIds.size
                    case 'any_date':
                        return assignedCount > 0 && assignedCount < scheduleIds.size
                    case 'no_dates':
                        return assignedCount === 0
                    default:
                        return true
                }
            })
        }

        // Filtro por fecha específica
        if (selectedDateFilter) {
            result = result.filter(m => {
                const modelAssignments = localAssignments[m.id] || new Set()
                return modelAssignments.has(selectedDateFilter)
            })
        }

        return result
    }, [models, searchQuery, genderFilter, statusFilter, availabilityFilter, selectedDateFilter, sortedSchedule, localAssignments])

    // Estadísticas para los badges de filtro
    const filterStats = useMemo(() => {
        const scheduleIds = new Set(sortedSchedule.map(s => s.id!))
        let male = 0, female = 0
        let allDates = 0, anyDate = 0, noDates = 0
        let approved = 0, pending = 0, rejected = 0

        models.forEach(m => {
            if (m.gender?.toLowerCase() === 'male') male++
            if (m.gender?.toLowerCase() === 'female') female++
            if (m.client_selection === 'approved') approved++
            if (m.client_selection === 'pending') pending++
            if (m.client_selection === 'rejected') rejected++

            const modelAssignments = localAssignments[m.id] || new Set()
            const assignedCount = [...modelAssignments].filter(id => scheduleIds.has(id)).length

            if (assignedCount === scheduleIds.size && scheduleIds.size > 0) allDates++
            else if (assignedCount > 0) anyDate++
            else noDates++
        })

        return { male, female, allDates, anyDate, noDates, approved, pending, rejected }
    }, [models, sortedSchedule, localAssignments])

    // Función para procesar la cola de cambios
    const processChangesQueue = useCallback(async () => {
        const changes = [...changesQueueRef.current]
        if (changes.length === 0) return

        changesQueueRef.current = []
        setIsSaving(true)

        setPendingChanges(prev =>
            prev.map(c => ({
                ...c,
                status: changes.some(q => q.modelId === c.modelId && q.scheduleId === c.scheduleId)
                    ? 'saving'
                    : c.status
            }))
        )

        const results = await Promise.all(
            changes.map(async (change) => {
                try {
                    let success: boolean
                    if (change.assigned) {
                        const result = await assignModelToSchedule(change.scheduleId, change.modelId, project.id)
                        success = result.success
                    } else {
                        const result = await unassignModelFromSchedule(change.scheduleId, change.modelId, project.id)
                        success = result.success
                    }
                    return { ...change, success }
                } catch {
                    return { ...change, success: false }
                }
            })
        )

        const successCount = results.filter(r => r.success).length
        const failCount = results.filter(r => !r.success).length

        setPendingChanges(prev => {
            const updated = prev.map(c => {
                const result = results.find(r => r.modelId === c.modelId && r.scheduleId === c.scheduleId)
                if (result) {
                    return { ...c, status: result.success ? 'saved' : 'error' } as PendingChange
                }
                return c
            })

            setTimeout(() => {
                setPendingChanges(p => p.filter(c => c.status !== 'saved'))
            }, 2000)

            return updated
        })

        results.forEach(result => {
            if (!result.success) {
                setLocalAssignments(prev => {
                    const newSet = new Set(prev[result.modelId])
                    if (result.assigned) {
                        newSet.delete(result.scheduleId)
                    } else {
                        newSet.add(result.scheduleId)
                    }
                    return { ...prev, [result.modelId]: newSet }
                })
            }
        })

        if (successCount > 0) {
            toast.success(`${successCount} asignación(es) guardada(s)`, { duration: 2000 })
        }
        if (failCount > 0) {
            toast.error(`${failCount} asignación(es) fallaron. Intenta de nuevo.`)
        }

        setIsSaving(false)
        onRefresh?.()
    }, [project.id, onRefresh])

    // Manejar toggle de asignación
    const handleToggle = useCallback((modelId: string, scheduleId: string) => {
        const currentlyAssigned = localAssignments[modelId]?.has(scheduleId) ?? false
        const newAssigned = !currentlyAssigned

        setLocalAssignments(prev => {
            const newSet = new Set(prev[modelId] || [])
            if (newAssigned) {
                newSet.add(scheduleId)
            } else {
                newSet.delete(scheduleId)
            }
            return { ...prev, [modelId]: newSet }
        })

        onAssignmentChange?.(modelId, scheduleId, newAssigned)

        const change: PendingChange = {
            modelId,
            scheduleId,
            assigned: newAssigned,
            status: 'pending',
        }

        const existingIndex = changesQueueRef.current.findIndex(
            c => c.modelId === modelId && c.scheduleId === scheduleId
        )

        if (existingIndex !== -1) {
            changesQueueRef.current.splice(existingIndex, 1)
        } else {
            changesQueueRef.current.push(change)
        }

        setPendingChanges(prev => {
            const existingIdx = prev.findIndex(
                c => c.modelId === modelId && c.scheduleId === scheduleId
            )
            if (existingIdx !== -1) {
                const updated = [...prev]
                updated[existingIdx] = change
                return updated
            }
            return [...prev, change]
        })

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current)
        }
        debounceTimerRef.current = setTimeout(() => {
            processChangesQueue()
        }, DEBOUNCE_MS)
    }, [localAssignments, onAssignmentChange, processChangesQueue])

    // Marcar/desmarcar todas las fechas para un modelo
    const handleToggleAllDates = useCallback((modelId: string) => {
        const modelAssignments = localAssignments[modelId] || new Set()
        const scheduleIds = sortedSchedule.map(s => s.id!)
        const allAssigned = scheduleIds.every(id => modelAssignments.has(id))

        // Si todas están marcadas, desmarcar todas; si no, marcar todas
        const newAssigned = !allAssigned

        scheduleIds.forEach(scheduleId => {
            const currentlyAssigned = modelAssignments.has(scheduleId)

            // Solo procesar si el estado cambia
            if (currentlyAssigned !== newAssigned) {
                setLocalAssignments(prev => {
                    const newSet = new Set(prev[modelId] || [])
                    if (newAssigned) {
                        newSet.add(scheduleId)
                    } else {
                        newSet.delete(scheduleId)
                    }
                    return { ...prev, [modelId]: newSet }
                })

                onAssignmentChange?.(modelId, scheduleId, newAssigned)

                const change: PendingChange = {
                    modelId,
                    scheduleId,
                    assigned: newAssigned,
                    status: 'pending',
                }

                const existingIndex = changesQueueRef.current.findIndex(
                    c => c.modelId === modelId && c.scheduleId === scheduleId
                )

                if (existingIndex !== -1) {
                    changesQueueRef.current.splice(existingIndex, 1)
                } else {
                    changesQueueRef.current.push(change)
                }

                setPendingChanges(prev => {
                    const existingIdx = prev.findIndex(
                        c => c.modelId === modelId && c.scheduleId === scheduleId
                    )
                    if (existingIdx !== -1) {
                        const updated = [...prev]
                        updated[existingIdx] = change
                        return updated
                    }
                    return [...prev, change]
                })
            }
        })

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current)
        }
        debounceTimerRef.current = setTimeout(() => {
            processChangesQueue()
        }, DEBOUNCE_MS)
    }, [localAssignments, sortedSchedule, onAssignmentChange, processChangesQueue])

    // Eliminar modelo del proyecto
    const handleRemoveModel = useCallback(async (modelId: string) => {
        setRemovingModelId(modelId)
        try {
            const result = await removeModelFromProject(project.id, modelId)
            if (result.success) {
                toast.success('Modelo eliminado del proyecto')
                onModelRemoved?.(modelId)
                onRefresh?.()
            } else {
                toast.error('Error al eliminar modelo')
            }
        } catch {
            toast.error('Error inesperado')
        }
        setRemovingModelId(null)
    }, [project.id, onModelRemoved, onRefresh])

    // Estados locales de selección (para feedback optimista)
    const [localSelections, setLocalSelections] = useState<Record<string, Model['client_selection']>>({})
    const [updatingSelection, setUpdatingSelection] = useState<string | null>(null)

    // Inicializar localSelections desde los modelos
    useEffect(() => {
        const initial: Record<string, Model['client_selection']> = {}
        models.forEach(m => {
            initial[m.id] = m.client_selection
        })
        setLocalSelections(initial)
    }, [models])

    // Cambiar estado de aprobación con un click
    const handleQuickSelection = useCallback(async (modelId: string, newStatus: 'approved' | 'rejected') => {
        const currentStatus = localSelections[modelId] || 'pending'

        // Toggle: si ya está en ese estado, volver a pending
        const finalStatus: 'approved' | 'rejected' | 'pending' = currentStatus === newStatus ? 'pending' : newStatus

        // Optimistic update
        setLocalSelections(prev => ({ ...prev, [modelId]: finalStatus }))
        setUpdatingSelection(modelId)

        // Llamar al servidor (solo si es approved o rejected, no pending)
        if (finalStatus !== 'pending') {
            const result = await updateModelSelection(project.id, modelId, finalStatus)
            if (result.success) {
                onSelectionChange?.(modelId, finalStatus)
            } else {
                // Revertir si falla
                setLocalSelections(prev => ({ ...prev, [modelId]: currentStatus }))
                toast.error('Error al cambiar estado')
            }
        } else {
            // Para volver a pending, usamos rejected como workaround (o necesitamos otra función)
            // Por ahora solo actualizamos local
            onSelectionChange?.(modelId, finalStatus)
        }

        setUpdatingSelection(null)
    }, [project.id, localSelections, onSelectionChange])

    // Guardar ahora
    const handleSaveNow = useCallback(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current)
        }
        processChangesQueue()
    }, [processChangesQueue])

    // Limpiar timer al desmontar
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current)
            }
        }
    }, [])

    // Limpiar todos los filtros
    const clearAllFilters = () => {
        setSearchQuery('')
        setGenderFilter('all')
        setAvailabilityFilter('all')
        setStatusFilter('all')
        setSelectedDateFilter(null)
    }

    const hasActiveFilters = searchQuery || genderFilter !== 'all' || availabilityFilter !== 'all' || statusFilter !== 'all' || selectedDateFilter
    const hasPendingChanges = pendingChanges.some(c => c.status === 'pending')

    if (models.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                    <p className="text-title font-medium text-muted-foreground">
                        No hay talentos en este proyecto
                    </p>
                    <p className="text-body text-muted-foreground mt-1">
                        Agrega talentos desde la búsqueda de la izquierda
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Talentos en el Proyecto
                            </CardTitle>
                            <CardDescription>
                                {filteredModels.length} de {models.length} talento(s) • {sortedSchedule.length} fecha(s)
                            </CardDescription>
                        </div>

                        {/* Indicador de guardado */}
                        <div className="flex items-center gap-2">
                            {isSaving && (
                                <Badge variant="secondary" className="animate-pulse">
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Guardando...
                                </Badge>
                            )}
                            {hasPendingChanges && !isSaving && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleSaveNow}
                                    className="h-7"
                                >
                                    <Save className="h-3 w-3 mr-1" />
                                    Guardar
                                </Button>
                            )}
                            {!hasPendingChanges && !isSaving && pendingChanges.some(c => c.status === 'saved') && (
                                <Badge variant="outline" className="border-success/20 text-success bg-success/10">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Guardado
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Barra de búsqueda y filtros */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Búsqueda */}
                        <div className="flex-1 min-w-48">
                            <SearchBar
                                value={searchQuery}
                                onValueChange={setSearchQuery}
                                onClear={() => setSearchQuery('')}
                                placeholder="Buscar por nombre..."
                                ariaLabel="Buscar por nombre"
                                inputClassName="h-9"
                            />
                        </div>

                        {/* Filtro de Género */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className={cn("h-9", genderFilter !== 'all' && "border-primary text-primary")}>
                                    <Filter className="h-3.5 w-3.5 mr-1.5" />
                                    Género
                                    {genderFilter !== 'all' && (
                                        <Badge variant="secondary" size="small" className="ml-1.5">
                                            {genderFilter === 'male' ? 'H' : 'M'}
                                        </Badge>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuLabel>Filtrar por género</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuCheckboxItem checked={genderFilter === 'all'} onCheckedChange={() => setGenderFilter('all')}>
                                    Todos ({models.length})
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem checked={genderFilter === 'male'} onCheckedChange={() => setGenderFilter('male')}>
                                    Hombres ({filterStats.male})
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem checked={genderFilter === 'female'} onCheckedChange={() => setGenderFilter('female')}>
                                    Mujeres ({filterStats.female})
                                </DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Filtro de Disponibilidad */}
                        {sortedSchedule.length > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className={cn("h-9", (availabilityFilter !== 'all' || selectedDateFilter) && "border-primary text-primary")}>
                                        <Calendar className="h-3.5 w-3.5 mr-1.5" />
                                        Fechas
                                        {(availabilityFilter !== 'all' || selectedDateFilter) && (
                                            <Badge variant="secondary" size="small" className="ml-1.5">1</Badge>
                                        )}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-56">
                                    <DropdownMenuLabel>Filtrar por asignación</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuCheckboxItem
                                        checked={availabilityFilter === 'all' && !selectedDateFilter}
                                        onCheckedChange={() => { setAvailabilityFilter('all'); setSelectedDateFilter(null); }}
                                    >
                                        Todos ({models.length})
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={availabilityFilter === 'all_dates'}
                                        onCheckedChange={() => { setAvailabilityFilter('all_dates'); setSelectedDateFilter(null); }}
                                    >
                                        ✓ Todas las fechas ({filterStats.allDates})
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={availabilityFilter === 'any_date'}
                                        onCheckedChange={() => { setAvailabilityFilter('any_date'); setSelectedDateFilter(null); }}
                                    >
                                        ○ Algunas fechas ({filterStats.anyDate})
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={availabilityFilter === 'no_dates'}
                                        onCheckedChange={() => { setAvailabilityFilter('no_dates'); setSelectedDateFilter(null); }}
                                    >
                                        ✗ Sin fechas ({filterStats.noDates})
                                    </DropdownMenuCheckboxItem>

                                    {sortedSchedule.length > 1 && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuLabel>Fecha específica</DropdownMenuLabel>
                                            {sortedSchedule.map(s => {
                                                const { dayNumber, month } = formatScheduleDate(s.date)
                                                return (
                                                    <DropdownMenuCheckboxItem
                                                        key={s.id}
                                                        checked={selectedDateFilter === s.id}
                                                        onCheckedChange={() => {
                                                            setSelectedDateFilter(selectedDateFilter === s.id ? null : s.id!)
                                                            setAvailabilityFilter('all')
                                                        }}
                                                    >
                                                        {dayNumber} {month}
                                                    </DropdownMenuCheckboxItem>
                                                )
                                            })}
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        {/* Filtro de Estado */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className={cn("h-9", statusFilter !== 'all' && "border-primary text-primary")}>
                                    <Check className="h-3.5 w-3.5 mr-1.5" />
                                    Estado
                                    {statusFilter !== 'all' && (
                                        <Badge variant="secondary" size="small" className="ml-1.5">1</Badge>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuLabel>Estado de selección</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuCheckboxItem checked={statusFilter === 'all'} onCheckedChange={() => setStatusFilter('all')}>
                                    Todos ({models.length})
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem checked={statusFilter === 'approved'} onCheckedChange={() => setStatusFilter('approved')}>
                                    <span className="text-success">Aprobados ({filterStats.approved})</span>
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem checked={statusFilter === 'pending'} onCheckedChange={() => setStatusFilter('pending')}>
                                    Pendientes ({filterStats.pending})
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem checked={statusFilter === 'rejected'} onCheckedChange={() => setStatusFilter('rejected')}>
                                    <span className="text-destructive">Rechazados ({filterStats.rejected})</span>
                                </DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Limpiar filtros */}
                        {hasActiveFilters && (
                            <Button variant="ghost" size="sm" className="h-9" onClick={clearAllFilters}>
                                <X className="h-3.5 w-3.5 mr-1" />
                                Limpiar
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                {/* Mobile/tablet: stacked cards (no horizontal swipe) */}
                <div className="lg:hidden p-4">
                    {filteredModels.length === 0 ? (
                        <div className="py-12 text-center">
                            <Search className="h-8 w-8 mx-auto text-muted-foreground mb-2 opacity-50" />
                            <p className="text-muted-foreground">No se encontraron talentos con estos filtros</p>
                            <Button variant="link" onClick={clearAllFilters} className="mt-2">
                                Limpiar filtros
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredModels.map((model) => {
                                const modelAssignments = localAssignments[model.id] || new Set()
                                const isRemoving = removingModelId === model.id

                                return (
                                    <div
                                        key={`mobile-${model.id}`}
                                        className={cn(
                                            "rounded-lg border p-3 space-y-3",
                                            isRemoving && "opacity-50"
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            <Avatar className="h-10 w-10 border shrink-0">
                                                <AvatarImage
                                                    src={model.coverUrl || `${SUPABASE_PUBLIC_URL}${model.id}/Portada/cover.jpg`}
                                                />
                                                <AvatarFallback className="text-label">
                                                    {model.alias?.substring(0, 2) || 'M'}
                                                </AvatarFallback>
                                            </Avatar>

                                            <div className="min-w-0 flex-1">
                                                <p className="text-body font-medium wrap-break-word">
                                                    {model.alias}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-2 text-label text-muted-foreground">
                                                    <span className={cn(
                                                        model.gender?.toLowerCase() === 'male' ? 'text-info' : 'text-primary'
                                                    )}>
                                                        {model.gender?.toLowerCase() === 'male' ? 'H' : 'M'}
                                                    </span>
                                                    <span>•</span>
                                                    <ProjectStatusBadge status={(localSelections[model.id] || model.client_selection) || 'pending'} size="small" />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 shrink-0">
                                                {updatingSelection === model.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                ) : (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className={cn(
                                                                "h-8 w-8 transition-all",
                                                                (localSelections[model.id] || model.client_selection) === 'approved'
                                                                    ? "bg-success/10 text-success hover:bg-success/20"
                                                                    : "text-muted-foreground hover:text-success hover:bg-success/10"
                                                            )}
                                                            onClick={() => handleQuickSelection(model.id, 'approved')}
                                                            disabled={isSaving || isRemoving}
                                                        >
                                                            <ThumbsUp className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className={cn(
                                                                "h-8 w-8 transition-all",
                                                                (localSelections[model.id] || model.client_selection) === 'rejected'
                                                                    ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                                                                    : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                            )}
                                                            onClick={() => handleQuickSelection(model.id, 'rejected')}
                                                            disabled={isSaving || isRemoving}
                                                        >
                                                            <ThumbsDown className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                    onClick={() => handleRemoveModel(model.id)}
                                                    disabled={isRemoving}
                                                >
                                                    {isRemoving ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <X className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>

                                        {sortedSchedule.length > 1 && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full"
                                                onClick={() => handleToggleAllDates(model.id)}
                                                disabled={isSaving || isRemoving}
                                            >
                                                <CheckCheck className="h-4 w-4 mr-2" />
                                                {sortedSchedule.every(s => modelAssignments.has(s.id!))
                                                    ? 'Desmarcar todas las fechas'
                                                    : 'Marcar todas las fechas'}
                                            </Button>
                                        )}

                                        {sortedSchedule.length === 0 ? (
                                            <div className="text-body text-muted-foreground">Sin fechas asignables.</div>
                                        ) : (
                                            <div className="space-y-2">
                                                {sortedSchedule.map((scheduleItem) => {
                                                    const isAssigned = modelAssignments.has(scheduleItem.id!)
                                                    const pendingChange = pendingChanges.find(
                                                        c => c.modelId === model.id && c.scheduleId === scheduleItem.id
                                                    )
                                                    const isPendingSave = pendingChange?.status === 'pending'
                                                    const isSavingThis = pendingChange?.status === 'saving'
                                                    const savedThis = pendingChange?.status === 'saved'
                                                    const errorThis = pendingChange?.status === 'error'

                                                    const { dayName, dayNumber, month } = formatScheduleDate(scheduleItem.date)
                                                    const hasMultipleSlots = datesWithMultipleSlots.has(scheduleItem.date)
                                                    const shortTime = scheduleItem.startTime?.replace(' AM', 'am').replace(' PM', 'pm') || ''

                                                    return (
                                                        <div
                                                            key={`mobile-slot-${model.id}-${scheduleItem.id}`}
                                                            className={cn(
                                                                "flex items-center justify-between gap-3 rounded-md border px-3 py-2",
                                                                isPendingSave && 'bg-warning/10',
                                                                savedThis && 'bg-success/10',
                                                                errorThis && 'bg-destructive/10'
                                                            )}
                                                        >
                                                            <div className="min-w-0">
                                                                <div className="text-body font-medium">
                                                                    {dayName} {dayNumber} {month}
                                                                </div>
                                                                {hasMultipleSlots && shortTime && (
                                                                    <div className="text-label text-muted-foreground">{shortTime}</div>
                                                                )}
                                                            </div>

                                                            {isSavingThis ? (
                                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                            ) : (
                                                                <Checkbox
                                                                    checked={isAssigned}
                                                                    onCheckedChange={() => handleToggle(model.id, scheduleItem.id!)}
                                                                    disabled={isSaving || isRemoving}
                                                                    className={cn(
                                                                        'h-5 w-5 transition-all shrink-0',
                                                                        isAssigned && 'data-[state=checked]:bg-primary'
                                                                    )}
                                                                />
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Desktop+: sticky-column assignment grid */}
                <div className="hidden lg:block">
                    <ScrollArea className="w-full">
                        <div className="min-w-max">
                            {/* Cabecera con fechas */}
                            <div className="flex border-b bg-muted/50 sticky top-0 z-10">
                                {/* Columna fija de modelos */}
                                <div className="w-72 min-w-72 px-4 py-3 font-medium text-body border-r bg-muted/80 sticky left-0 z-20">
                                    Talento
                                </div>

                                {/* Columnas de fechas */}
                                {sortedSchedule.map((item) => {
                                    const { dayName, dayNumber, month, fullDate } = formatScheduleDate(item.date)
                                    const hasMultipleSlots = datesWithMultipleSlots.has(item.date)
                                    // Formatear hora sin AM/PM para ahorrar espacio
                                    const shortTime = item.startTime?.replace(' AM', 'am').replace(' PM', 'pm') || ''

                                    return (
                                        <div
                                            key={item.id}
                                            className="flex-1 min-w-28 px-3 py-3 text-center border-r last:border-r-0"
                                        >
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="cursor-help">
                                                            <p className="text-label text-muted-foreground capitalize">
                                                                {dayName}
                                                            </p>
                                                            <p className="text-title font-bold">{dayNumber}</p>
                                                            <p className="text-label text-muted-foreground capitalize">
                                                                {month}
                                                            </p>
                                                            {hasMultipleSlots && (
                                                                <p className="text-label text-foreground/60 font-medium mt-0.5">
                                                                    {shortTime}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p className="font-medium capitalize">{fullDate}</p>
                                                        <p className="text-label text-muted-foreground">{item.startTime} - {item.endTime}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    )
                                })}

                                {/* Columna de acciones */}
                                <div className="w-16 min-w-16" />
                            </div>

                            {/* Filas de modelos */}
                            <ScrollArea className="h-100">
                                {filteredModels.length === 0 ? (
                                    <div className="py-12 text-center">
                                        <Search className="h-8 w-8 mx-auto text-muted-foreground mb-2 opacity-50" />
                                        <p className="text-muted-foreground">No se encontraron talentos con estos filtros</p>
                                        <Button variant="link" onClick={clearAllFilters} className="mt-2">
                                            Limpiar filtros
                                        </Button>
                                    </div>
                                ) : (
                                    filteredModels.map((model) => {
                                        const modelAssignments = localAssignments[model.id] || new Set()
                                        const isRemoving = removingModelId === model.id

                                        return (
                                            <div
                                                key={model.id}
                                                className={cn(
                                                    "flex border-b last:border-b-0 hover:bg-muted/30 transition-colors",
                                                    isRemoving && "opacity-50"
                                                )}
                                            >
                                                {/* Info del modelo */}
                                                <div className="w-72 min-w-72 px-4 py-3 flex items-center gap-3 border-r bg-background sticky left-0 z-10">
                                                    <Avatar className="h-10 w-10 border">
                                                        <AvatarImage
                                                            src={model.coverUrl || `${SUPABASE_PUBLIC_URL}${model.id}/Portada/cover.jpg`}
                                                        />
                                                        <AvatarFallback className="text-label">
                                                            {model.alias?.substring(0, 2) || 'M'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-body font-medium truncate">
                                                            {model.alias}
                                                        </p>
                                                        <div className="flex items-center gap-1.5 text-label">
                                                            <span className={cn(
                                                                model.gender?.toLowerCase() === 'male' ? 'text-info' : 'text-primary'
                                                            )}>
                                                                {model.gender?.toLowerCase() === 'male' ? 'H' : 'M'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Botones de aprobación rápida ✓/✗ */}
                                                    <div className="flex items-center gap-1">
                                                        {updatingSelection === model.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                        ) : (
                                                            <>
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className={cn(
                                                                                    "h-7 w-7 transition-all",
                                                                                    (localSelections[model.id] || model.client_selection) === 'approved'
                                                                                        ? "bg-success/10 text-success hover:bg-success/20"
                                                                                        : "text-muted-foreground hover:text-success hover:bg-success/10"
                                                                                )}
                                                                                onClick={() => handleQuickSelection(model.id, 'approved')}
                                                                                disabled={isSaving || isRemoving}
                                                                            >
                                                                                <ThumbsUp className="h-4 w-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>Aprobar</TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className={cn(
                                                                                    "h-7 w-7 transition-all",
                                                                                    (localSelections[model.id] || model.client_selection) === 'rejected'
                                                                                        ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                                                                                        : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                                                )}
                                                                                onClick={() => handleQuickSelection(model.id, 'rejected')}
                                                                                disabled={isSaving || isRemoving}
                                                                            >
                                                                                <ThumbsDown className="h-4 w-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>Rechazar</TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            </>
                                                        )}
                                                    </div>

                                                    {/* Botón marcar todas las fechas (solo si hay 2+ fechas) */}
                                                    {sortedSchedule.length > 1 && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className={cn(
                                                                            "h-7 w-7 shrink-0",
                                                                            sortedSchedule.every(s => modelAssignments.has(s.id!))
                                                                                ? "text-primary"
                                                                                : "text-muted-foreground"
                                                                        )}
                                                                        onClick={() => handleToggleAllDates(model.id)}
                                                                        disabled={isSaving || isRemoving}
                                                                    >
                                                                        <CheckCheck className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    {sortedSchedule.every(s => modelAssignments.has(s.id!))
                                                                        ? "Desmarcar todas las fechas"
                                                                        : "Marcar todas las fechas"}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                </div>

                                                {/* Checkboxes de asignación */}
                                                {sortedSchedule.map((scheduleItem) => {
                                                    const isAssigned = modelAssignments.has(scheduleItem.id!)
                                                    const pendingChange = pendingChanges.find(
                                                        c => c.modelId === model.id && c.scheduleId === scheduleItem.id
                                                    )
                                                    const isPendingSave = pendingChange?.status === 'pending'
                                                    const isSavingThis = pendingChange?.status === 'saving'
                                                    const savedThis = pendingChange?.status === 'saved'
                                                    const errorThis = pendingChange?.status === 'error'

                                                    return (
                                                        <div
                                                            key={scheduleItem.id}
                                                            className={cn(
                                                                'flex-1 min-w-28 flex items-center justify-center border-r last:border-r-0 py-3',
                                                                isPendingSave && 'bg-warning/10',
                                                                savedThis && 'bg-success/10',
                                                                errorThis && 'bg-destructive/10'
                                                            )}
                                                        >
                                                            {isSavingThis ? (
                                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                            ) : (
                                                                <Checkbox
                                                                    checked={isAssigned}
                                                                    onCheckedChange={() => handleToggle(model.id, scheduleItem.id!)}
                                                                    disabled={isSaving || isRemoving}
                                                                    className={cn(
                                                                        'h-5 w-5 transition-all',
                                                                        isAssigned && 'data-[state=checked]:bg-primary'
                                                                    )}
                                                                />
                                                            )}
                                                        </div>
                                                    )
                                                })}

                                                {/* Botón eliminar */}
                                                <div className="w-16 min-w-16 flex items-center justify-center">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                                    onClick={() => handleRemoveModel(model.id)}
                                                                    disabled={isRemoving}
                                                                >
                                                                    {isRemoving ? (
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        <X className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Quitar del proyecto</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </ScrollArea>
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </div>
            </CardContent >
        </Card >
    )
}
