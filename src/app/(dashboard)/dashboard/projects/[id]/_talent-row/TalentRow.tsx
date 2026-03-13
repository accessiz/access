'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Model, Project } from '@/lib/types';
import { SUPABASE_PUBLIC_URL } from '@/lib/constants';
import { assignModelToSchedule, unassignModelFromSchedule } from '@/lib/actions/projects_models';
import { syncProjectSchedule } from '@/lib/actions/projects';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ProjectStatusBadge } from '@/components/molecules/ProjectStatusBadge';
import { PaymentEditorPopover } from '../_payment-editor/PaymentEditor';
import {
    PlusCircle, XCircle, Loader2,
    CalendarCheck2,
} from 'lucide-react';

import type { TalentRowProps } from './TalentRow.types';

const ClientStatusBadge = ({ status }: { status: Model['client_selection'] }) => {
    return <ProjectStatusBadge status={status || 'pending'} size="small" />;
};

export function TalentRow({
    model,
    project,
    onAction,
    isPending,
    actionType,
    onRefresh,
    onAssignmentChange,
    onPaymentChange,
}: TalentRowProps) {
    const [isAssigning, setIsAssigning] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    const handleToggleAssignment = async (scheduleId: string, currentAssigned: boolean) => {
        setIsAssigning(true);

        // Optimistic update ANTES de la llamada al servidor
        onAssignmentChange?.(model.id, scheduleId, !currentAssigned);

        let success = false;
        if (currentAssigned) {
            const result = await unassignModelFromSchedule(scheduleId, model.id, project.id);
            success = result.success;
        } else {
            const result = await assignModelToSchedule(scheduleId, model.id, project.id);
            success = result.success;
        }

        if (!success) {
            // Revertir si falla
            onAssignmentChange?.(model.id, scheduleId, currentAssigned);
            toast.error('Error al actualizar asignación');
        }

        setIsAssigning(false);
    };

    const handleSync = async () => {
        setIsSyncing(true);
        const result = await syncProjectSchedule(project.id);
        if (result.success) {
            toast.success('Horarios sincronizados correctamente.');
            onRefresh?.();
        } else {
            toast.error(result.error || 'Error al sincronizar.');
        }
        setIsSyncing(false);
    };

    return (
        <div className="flex flex-col gap-y-2 p-2 hover:bg-hover-overlay rounded-md transition-colors">
            <div className="flex items-center gap-x-3 gap-y-3">
                <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage src={model.coverUrl || `${SUPABASE_PUBLIC_URL}${model.id}/Portada/cover.jpg`} />
                    <AvatarFallback>{model.alias?.substring(0, 2) || 'IZ'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-x-2 gap-y-2">
                        <p className="text-body font-medium truncate">{model.alias}</p>
                        {actionType === 'remove' && (
                            <>
                                {(model.agreed_fee || 0) > 0 && (
                                    <Badge variant="outline" size="small" className="font-mono">
                                        {model.currency} {model.agreed_fee} {model.fee_type === 'per_day' ? '/d' : model.fee_type === 'per_hour' ? '/h' : ''}
                                    </Badge>
                                )}
                                {(model.trade_fee || 0) > 0 && (
                                    <Badge variant="secondary" size="small" className="font-mono bg-purple/10 text-purple border-purple/20">
                                        {model.currency} {model.trade_fee} {model.fee_type === 'per_day' ? '/d' : model.fee_type === 'per_hour' ? '/h' : ''} (Canje)
                                    </Badge>
                                )}
                                {!(model.agreed_fee || 0) && !(model.trade_fee || 0) && (
                                    <Badge variant="outline" size="small" className="font-mono text-muted-foreground border-dashed">
                                        Sin tarifa
                                    </Badge>
                                )}
                            </>
                        )}
                    </div>
                    <p className="text-label text-muted-foreground truncate">{model.country}</p>
                </div>

                <div className="flex items-center gap-x-2 gap-y-2">
                    {actionType === 'remove' && (
                        <>
                            <ClientStatusBadge status={model.client_selection} />
                            <PaymentEditorPopover model={model} project={project} onRefresh={onRefresh} onPaymentChange={onPaymentChange} />
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button size="icon" variant="outline" className="h-8 w-8" disabled={isPending || isAssigning || isSyncing}>
                                        <CalendarCheck2 className="h-4 w-4" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-4" align="end">
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <h4 className="font-medium text-body">Asignar Horarios</h4>
                                            <p className="text-label text-muted-foreground">Define cuándo estará presente el talento.</p>
                                        </div>
                                        <div className="space-y-3">
                                            {(() => {
                                                const scheduleItems = project.schedule || [];
                                                const hasValidIds = scheduleItems.some(item => !!item.id);

                                                if (scheduleItems.length > 0 && !hasValidIds) {
                                                    return (
                                                        <div className="space-y-3">
                                                            <p className="text-label text-info bg-info/10 p-2 rounded-md border border-info/20 italic">
                                                                Los horarios de este proyecto necesitan activarse para poder asignar modelos.
                                                            </p>
                                                            <Button
                                                                size="sm"
                                                                className="w-full h-8 text-label"
                                                                onClick={handleSync}
                                                                disabled={isSyncing}
                                                            >
                                                                {isSyncing ? <Loader2 className="animate-spin h-3 w-3 mr-2" /> : <CalendarCheck2 className="h-3 w-3 mr-2" />}
                                                                Activar Horarios
                                                            </Button>
                                                        </div>
                                                    );
                                                }

                                                if (scheduleItems.length === 0) {
                                                    return (
                                                        <p className="text-label text-muted-foreground italic">No hay horarios definidos en el proyecto.</p>
                                                    );
                                                }

                                                return scheduleItems.map((item) => {
                                                    if (!item.id) return null;
                                                    const isAssigned = !!model.assignments?.some(a => a.schedule_id === item.id);
                                                    const dateObj = new Date(`${item.date}T00:00:00`);
                                                    const label = `${dateObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })} (${item.startTime})`;

                                                    return (
                                                        <div key={item.id} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={`assign-${model.id}-${item.id}`}
                                                                checked={isAssigned}
                                                                disabled={isAssigning}
                                                                onCheckedChange={() => handleToggleAssignment(item.id!, isAssigned)}
                                                            />
                                                            <Label
                                                                htmlFor={`assign-${model.id}-${item.id}`}
                                                                className="text-label cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                            >
                                                                {label}
                                                            </Label>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </>
                    )}

                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onAction} disabled={isPending || isAssigning || isSyncing}>
                        {isPending ? <Loader2 className="animate-spin h-4 w-4" /> : (
                            actionType === 'add' ? <PlusCircle className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-destructive" />
                        )}
                    </Button>
                </div>
            </div>

            {actionType === 'remove' && model.assignments && model.assignments.length > 0 && (
                <div className="flex flex-wrap gap-x-2 gap-y-2 ml-13">
                    {model.assignments.map(a => {
                        const scheduleItem = project.schedule?.find(s => s.id === a.schedule_id);
                        if (!scheduleItem) return null;
                        const dateObj = new Date(`${scheduleItem.date}T00:00:00`);
                        return (
                            <Badge key={a.id} variant="secondary" size="small" className="font-normal bg-info/10 text-info border-info/20">
                                {dateObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}
                            </Badge>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
