'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import {
    Loader2, Save, AlertCircle, CheckCircle2
} from 'lucide-react'
import { Model, Project } from '@/lib/types'
import { assignModelToSchedule, unassignModelFromSchedule } from '@/lib/actions/projects_models'

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

interface AssignmentGridProps {
    project: Project
    models: Model[]
    onAssignmentChange?: (modelId: string, scheduleId: string, assigned: boolean) => void
    onRefresh?: () => void
}

interface PendingChange {
    modelId: string
    scheduleId: string
    assigned: boolean
    status: 'pending' | 'saving' | 'saved' | 'error'
}

const formatScheduleDate = (dateStr: string) => {
    const date = new Date(`${dateStr}T00:00:00`)
    return {
        dayName: date.toLocaleDateString('es-ES', { weekday: 'short' }),
        dayNumber: date.getDate(),
        month: date.toLocaleDateString('es-ES', { month: 'short' }),
    }
}

// Debounce para auto-guardado
const DEBOUNCE_MS = 800

export function AssignmentGrid({
    project,
    models,
    onAssignmentChange,
    onRefresh,
}: AssignmentGridProps) {
    const [localAssignments, setLocalAssignments] = useState<Record<string, Set<string>>>({})
    const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([])
    const [isSaving, setIsSaving] = useState(false)
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
    const changesQueueRef = useRef<PendingChange[]>([])

    // Ordenar schedule por fecha+hora
    const sortedSchedule = useMemo(() => {
        if (!project.schedule) return []
        return [...project.schedule]
            .filter(s => s.id)
            .sort((a, b) => {
                const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime()
                if (dateCompare !== 0) return dateCompare
                // Comparar horas si misma fecha
                return a.startTime.localeCompare(b.startTime)
            })
    }, [project.schedule])

    // Inicializar asignaciones locales desde los modelos
    useEffect(() => {
        const initial: Record<string, Set<string>> = {}
        models.forEach(model => {
            initial[model.id] = new Set(
                model.assignments?.map(a => a.schedule_id).filter(Boolean) as string[]
            )
        })
        setLocalAssignments(initial)
    }, [models])

    // Función para procesar la cola de cambios
    const processChangesQueue = useCallback(async () => {
        const changes = [...changesQueueRef.current]
        if (changes.length === 0) return

        changesQueueRef.current = []
        setIsSaving(true)

        // Marcar todos como "saving"
        setPendingChanges(prev =>
            prev.map(c => ({
                ...c,
                status: changes.some(q => q.modelId === c.modelId && q.scheduleId === c.scheduleId)
                    ? 'saving'
                    : c.status
            }))
        )

        // Procesar cada cambio
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

        // Actualizar estado de cambios
        const successCount = results.filter(r => r.success).length
        const failCount = results.filter(r => !r.success).length

        // Actualizar estados visuales
        setPendingChanges(prev => {
            const updated = prev.map(c => {
                const result = results.find(r => r.modelId === c.modelId && r.scheduleId === c.scheduleId)
                if (result) {
                    return { ...c, status: result.success ? 'saved' : 'error' } as PendingChange
                }
                return c
            })

            // Limpiar cambios guardados después de un momento
            setTimeout(() => {
                setPendingChanges(p => p.filter(c => c.status !== 'saved'))
            }, 2000)

            return updated
        })

        // Revertir cambios fallidos en el estado local
        results.forEach(result => {
            if (!result.success) {
                setLocalAssignments(prev => {
                    const newSet = new Set(prev[result.modelId])
                    // Revertir: si habíamos añadido, quitar; si habíamos quitado, añadir
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

        // Actualización optimista inmediata
        setLocalAssignments(prev => {
            const newSet = new Set(prev[modelId] || [])
            if (newAssigned) {
                newSet.add(scheduleId)
            } else {
                newSet.delete(scheduleId)
            }
            return { ...prev, [modelId]: newSet }
        })

        // Notificar al padre (optimistic update)
        onAssignmentChange?.(modelId, scheduleId, newAssigned)

        // Agregar a la cola de cambios
        const change: PendingChange = {
            modelId,
            scheduleId,
            assigned: newAssigned,
            status: 'pending',
        }

        // Verificar si ya existe un cambio pendiente para revertirlo o actualizarlo
        const existingIndex = changesQueueRef.current.findIndex(
            c => c.modelId === modelId && c.scheduleId === scheduleId
        )

        if (existingIndex !== -1) {
            // Si el nuevo estado es igual al original, remover de la cola
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

        // Debounce para auto-guardar
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current)
        }
        debounceTimerRef.current = setTimeout(() => {
            processChangesQueue()
        }, DEBOUNCE_MS)
    }, [localAssignments, onAssignmentChange, processChangesQueue])

    // Guardar todos los cambios inmediatamente
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

    const hasPendingChanges = pendingChanges.some(c => c.status === 'pending')

    if (!sortedSchedule.length) {
        return (
            <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                    <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                        No hay horarios definidos para este proyecto.
                    </p>
                    <p className="text-body text-muted-foreground mt-1">
                        Edita el proyecto para agregar fechas y horarios.
                    </p>
                </CardContent>
            </Card>
        )
    }

    if (models.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                    <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                        No hay modelos asignados a este proyecto.
                    </p>
                    <p className="text-body text-muted-foreground mt-1">
                        Agrega modelos desde la sección de selección.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-title">Asignaciones por Fecha</CardTitle>
                        <CardDescription>
                            Marca las casillas para indicar qué días trabajará cada modelo
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
                                Guardar ahora
                            </Button>
                        )}
                        {!hasPendingChanges && !isSaving && pendingChanges.some(c => c.status === 'saved') && (
                            <Badge variant="success">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Guardado
                            </Badge>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <ScrollArea className="w-full">
                    <div className="min-w-max">
                        {/* Cabecera con fechas */}
                        <div className="flex border-b bg-muted/50 sticky top-0 z-10">
                            {/* Columna fija de modelos */}
                            <div className="w-48 min-w-48 px-4 py-3 font-medium text-body border-r bg-muted/80 sticky left-0 z-20">
                                Modelo
                            </div>

                            {/* Columnas de fechas */}
                            {sortedSchedule.map((item) => {
                                const { dayName, dayNumber, month } = formatScheduleDate(item.date)
                                return (
                                    <div
                                        key={item.id}
                                        className="w-20 min-w-20 px-2 py-3 text-center border-r last:border-r-0"
                                    >
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="cursor-help">
                                                        <p className="text-label text-muted-foreground capitalize">
                                                            {dayName}
                                                        </p>
                                                        <p className="text-title font-semibold">{dayNumber}</p>
                                                        <p className="text-label text-muted-foreground capitalize">
                                                            {month}
                                                        </p>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className="font-medium">{item.startTime} - {item.endTime}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Filas de modelos */}
                        {models.map((model) => {
                            const modelAssignments = localAssignments[model.id] || new Set()

                            return (
                                <div
                                    key={model.id}
                                    className="flex border-b last:border-b-0 hover:bg-hover-overlay transition-colors"
                                >
                                    {/* Info del modelo */}
                                    <div className="w-48 min-w-48 px-4 py-3 flex items-center gap-3 border-r bg-background sticky left-0 z-10">
                                        <Avatar className="h-8 w-8 border">
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
                                            <div className="mt-1">
                                                <ProjectStatusBadge status={model.client_selection || 'pending'} size="small" />
                                            </div>
                                        </div>
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
                                                    'w-20 min-w-20 flex items-center justify-center border-r last:border-r-0',
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
                                                        disabled={isSaving}
                                                        className={cn(
                                                            'h-5 w-5 transition-all',
                                                            isAssigned && 'data-[state=checked]:bg-primary'
                                                        )}
                                                    />
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )
                        })}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
