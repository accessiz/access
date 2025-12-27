'use client'

import { useState, useMemo } from 'react'
import { AlertCircle, ArrowRight, Loader2, Check, Trash2 } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export interface ScheduleChange {
    type: 'added' | 'removed' | 'modified'
    oldScheduleId?: string
    oldDate?: string
    oldStartTime?: string
    oldEndTime?: string
    newDate?: string
    newStartTime?: string
    newEndTime?: string
    assignmentCount?: number
    assignedModelIds?: string[]
}

export interface NewScheduleOption {
    date: string
    startTime: string
    endTime: string
}

export type MigrationMapping = Record<string, string | 'none' | 'delete'>

interface ScheduleMigrationModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    changes: ScheduleChange[]
    newSchedules: NewScheduleOption[]
    projectName: string
    onConfirm: (mapping: MigrationMapping) => Promise<void>
    isProcessing?: boolean
}

const formatDateShort = (dateStr: string) => {
    const date = new Date(`${dateStr}T00:00:00`)
    return date.toLocaleDateString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    })
}

const formatNewScheduleOption = (schedule: NewScheduleOption) => {
    const date = new Date(`${schedule.date}T00:00:00`)
    const formatted = date.toLocaleDateString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    })
    return `${formatted} - ${schedule.startTime} (Nueva)`
}

// Crear un ID único para cada schedule (fecha + hora de inicio)
const getScheduleUniqueId = (schedule: NewScheduleOption) => {
    return `${schedule.date}|${schedule.startTime}`
}

export function ScheduleMigrationModal({
    open,
    onOpenChange,
    changes,
    newSchedules,
    _projectName,
    onConfirm,
    isProcessing = false,
}: ScheduleMigrationModalProps) {
    // Solo mostrar schedules eliminados que tienen asignaciones
    const schedulesWithAssignments = useMemo(() =>
        changes.filter(c => c.type === 'removed' && (c.assignmentCount || 0) > 0),
        [changes]
    )

    // Estado del mapeo
    const [mapping, setMapping] = useState<MigrationMapping>(() => {
        const initial: MigrationMapping = {}
        schedulesWithAssignments.forEach(schedule => {
            if (schedule.oldScheduleId) {
                initial[schedule.oldScheduleId] = '' // Sin selección inicial
            }
        })
        return initial
    })

    const handleMappingChange = (oldScheduleId: string, newValue: string) => {
        setMapping(prev => ({
            ...prev,
            [oldScheduleId]: newValue
        }))
    }

    const handleConfirm = async () => {
        await onConfirm(mapping)
    }

    const handleDiscard = () => {
        // Marcar todo como "delete" y confirmar
        const discardMapping: MigrationMapping = {}
        schedulesWithAssignments.forEach(schedule => {
            if (schedule.oldScheduleId) {
                discardMapping[schedule.oldScheduleId] = 'delete'
            }
        })
        onConfirm(discardMapping)
    }

    // Si no hay asignaciones afectadas, confirmar directamente
    if (schedulesWithAssignments.length === 0) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                <Check className="h-5 w-5 text-green-500" />
                            </div>
                            Cambios listos para guardar
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                            Los cambios en las fechas no afectan ninguna asignación existente.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isProcessing}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                'Guardar Cambios'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                            <AlertCircle className="h-5 w-5 text-amber-500" />
                        </div>
                        Reasignar Modelos
                    </DialogTitle>
                    <DialogDescription className="pt-2">
                        Acción requerida: Mueve los modelos de las fechas eliminadas a los nuevos horarios disponibles.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[400px] pr-4">
                    <div className="space-y-4 py-3">
                        {schedulesWithAssignments.map((schedule) => {
                            const isSelected = mapping[schedule.oldScheduleId!] && mapping[schedule.oldScheduleId!] !== ''

                            return (
                                <div
                                    key={schedule.oldScheduleId}
                                    className={cn(
                                        "relative rounded-lg border p-5 transition-all",
                                        isSelected
                                            ? "border-primary bg-primary/5"
                                            : "border-border"
                                    )}
                                >
                                    <div className="flex items-center gap-5">
                                        {/* Icono de papelera */}
                                        <div className="flex-shrink-0">
                                            <div className="h-11 w-11 rounded-lg bg-muted flex items-center justify-center">
                                                <Trash2 className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                        </div>

                                        {/* Fecha antigua */}
                                        <div className="flex-shrink-0 min-w-[100px]">
                                            <p className="text-sm font-medium line-through text-muted-foreground">
                                                {formatDateShort(schedule.oldDate!)}
                                            </p>
                                            <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                                                {schedule.assignmentCount} asignacion{schedule.assignmentCount !== 1 ? 'es' : ''}
                                            </p>
                                        </div>

                                        {/* Flecha */}
                                        <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />

                                        {/* Selector de destino */}
                                        <div className="flex-1 min-w-[180px]">
                                            <Select
                                                value={mapping[schedule.oldScheduleId!] || ''}
                                                onValueChange={(value) => handleMappingChange(schedule.oldScheduleId!, value)}
                                            >
                                                <SelectTrigger className={cn(
                                                    "w-full h-11",
                                                    isSelected && "border-primary"
                                                )}>
                                                    <SelectValue placeholder="Elegir nueva fecha..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {newSchedules.map((newSchedule, idx) => (
                                                        <SelectItem key={idx} value={getScheduleUniqueId(newSchedule)}>
                                                            {formatNewScheduleOption(newSchedule)}
                                                        </SelectItem>
                                                    ))}

                                                    {newSchedules.length > 0 && (
                                                        <div className="my-1 border-t" />
                                                    )}

                                                    <SelectItem value="none">
                                                        Sin fecha (mantener sin asignar)
                                                    </SelectItem>
                                                    <SelectItem value="delete" className="text-destructive">
                                                        Eliminar asignaciones
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Check indicator */}
                                    {isSelected && (
                                        <div className="absolute -right-2 -top-2">
                                            <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                                <Check className="h-3 w-3 text-primary-foreground" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </ScrollArea>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button
                        variant="ghost"
                        onClick={handleDiscard}
                        disabled={isProcessing}
                        className="text-muted-foreground hover:text-destructive sm:mr-auto"
                    >
                        Descartar
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isProcessing}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Aplicando...
                            </>
                        ) : (
                            'Aplicar Cambios'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export type MigrationOption = 'migrate' | 'keep' | 'delete'
