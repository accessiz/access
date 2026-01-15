'use client'

import { useState, useMemo } from 'react'
import { AlertCircle, ArrowDown, Loader2, Check, Users } from 'lucide-react'
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
    return `${formatted} - ${schedule.startTime}`
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
                            <div className="h-12 w-12 rounded-full bg-success/20 border border-success flex items-center justify-center">
                                <Check className="h-6 w-6 text-success" />
                            </div>
                            <span className="text-title font-semibold">Cambios listos para guardar</span>
                        </DialogTitle>
                        <DialogDescription className="pt-2 text-body text-muted-foreground">
                            Los cambios en las fechas no afectan ninguna asignación existente.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isProcessing}
                            className="border-separator bg-transparent hover:bg-hover-overlay"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={isProcessing}
                            className="bg-[rgb(var(--purple))] hover:bg-[rgb(var(--purple))]/90 text-white"
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
            <DialogContent className="max-w-md sm:max-w-lg p-0 gap-0 overflow-visible">
                <DialogHeader className="p-6 pb-4 space-y-4">
                    {/* Warning Icon */}
                    <div className="w-12 h-12 rounded-full bg-warning/20 border border-warning flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-warning" />
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-2">
                        <DialogTitle className="text-display font-semibold text-foreground">
                            Reasignar Modelos
                        </DialogTitle>
                        <DialogDescription className="text-body text-muted-foreground">
                            Acción requerida: Mueve los modelos de las fechas eliminadas a los nuevos horarios disponibles.
                        </DialogDescription>
                    </div>
                </DialogHeader>

                {/* Content */}
                <ScrollArea className="max-h-[50vh] px-6">
                    <div className="space-y-6 py-2">
                        {schedulesWithAssignments.map((schedule) => {
                            const isSelected = mapping[schedule.oldScheduleId!] && mapping[schedule.oldScheduleId!] !== ''

                            return (
                                <div
                                    key={schedule.oldScheduleId}
                                    className="relative rounded-lg border border-separator p-4"
                                >
                                    {/* Old Date Card - Red border */}
                                    <div className="rounded-lg border border-red bg-red/5 p-3 mb-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-body font-medium text-foreground">
                                                {formatDateShort(schedule.oldDate!)}
                                            </span>
                                            <div className="flex items-center gap-1.5 text-red">
                                                <Users className="h-4 w-4" />
                                                <span className="text-body font-medium">
                                                    {schedule.assignmentCount} Asignacion{schedule.assignmentCount !== 1 ? 'es' : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Arrow Down */}
                                    <div className="flex justify-center mb-4">
                                        <ArrowDown className="h-5 w-5 text-muted-foreground" />
                                    </div>

                                    {/* Target Selector */}
                                    <Select
                                        value={mapping[schedule.oldScheduleId!] || ''}
                                        onValueChange={(value) => handleMappingChange(schedule.oldScheduleId!, value)}
                                    >
                                        <SelectTrigger className={cn(
                                            "w-full h-12 sm:h-10 bg-card border-separator",
                                            isSelected && "border-purple bg-purple/20 text-white"
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
                                                <div className="my-1 border-t border-separator" />
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
                            )
                        })}
                    </div>
                </ScrollArea>

                {/* Footer */}
                <DialogFooter className="p-6 pt-4 gap-3 sm:gap-3 flex-row">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isProcessing}
                        className="flex-1 h-12 sm:h-10 border-separator bg-transparent hover:bg-hover-overlay text-body font-medium"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isProcessing}
                        className="flex-1 h-12 sm:h-10 bg-[rgb(var(--purple))] hover:bg-[rgb(var(--purple))]/90 text-white text-body font-medium"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Aplicando...
                            </>
                        ) : (
                            'Aplicar'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export type MigrationOption = 'migrate' | 'keep' | 'delete'
