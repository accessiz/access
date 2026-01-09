'use client'

import { useState, useTransition, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Model, Project } from '@/lib/types';
import { addModelToProject, updateModelPaymentDetail } from '@/lib/actions/projects_models';
import { SUPABASE_PUBLIC_URL } from '@/lib/constants';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ShareProjectDialog } from '@/components/organisms/ShareProjectDialog';
import { DeleteProjectDialog } from '@/components/organisms/DeleteProjectDialog';
import { ProjectStatusUpdater } from '@/components/organisms/ProjectStatusUpdater';
import {
    PlusCircle, XCircle, Search, Loader2, Share2, Eye,
    CheckCircle2, XCircle as XCircleIcon, Clock, ChevronLeft, Pencil,
    CalendarCheck2, Banknote, Save, Calculator, Info
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ProjectForm } from '@/components/organisms/ProjectForm';
import { TalentAssignmentPanel } from '@/components/organisms/TalentAssignmentPanel';
import { assignModelToSchedule, unassignModelFromSchedule } from '@/lib/actions/projects_models';
import { syncProjectSchedule, autoCloseExpiredProject } from '@/lib/actions/projects';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


const ClientStatusBadge = ({ status }: { status: Model['client_selection'] }) => {
    if (status === 'approved') {
        return <Badge variant="outline" className="border-green-500 text-green-500 bg-green-500/10"><CheckCircle2 className="mr-1 h-3 w-3" /> Aprobado</Badge>;
    }
    if (status === 'rejected') {
        return <Badge variant="outline" className="border-red-500 text-red-500 bg-red-500/10"><XCircleIcon className="mr-1 h-3 w-3" /> Rechazado</Badge>;
    }
    return <Badge variant="outline"><Clock className="mr-1 h-3 w-3" /> Pendiente</Badge>;
};

// Componente de Resumen de Presupuesto
const BudgetSummaryCard = ({ project, selectedModels }: { project: Project, selectedModels: Model[] }) => {
    // Calcular estadísticas
    const approvedModels = selectedModels.filter(m => m.client_selection === 'approved');
    const pendingModels = selectedModels.filter(m => m.client_selection === 'pending');

    // Calcular total a pagar solo para modelos aprobados
    const totalApproved = approvedModels.reduce((sum, model) => {
        const fee = model.agreed_fee || project.default_model_fee || 0;
        const daysWorked = model.assignments?.length || 1;
        return sum + (fee * daysWorked);
    }, 0);

    // Calcular estimado pendiente (si todos los pendientes fueran aprobados)
    const estimatedPending = pendingModels.reduce((sum, model) => {
        const fee = model.agreed_fee || project.default_model_fee || 0;
        const daysWorked = model.assignments?.length || 1;
        return sum + (fee * daysWorked);
    }, 0);

    const currency = project.currency || 'GTQ';
    const feeType = project.default_fee_type === 'per_hour' ? '/hora' : project.default_fee_type === 'fixed' ? 'fijo' : '/día';

    return (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <Calculator className="h-5 w-5" />
                    Resumen de Presupuesto
                </CardTitle>
                <CardDescription>
                    Tarifa base: <span className="font-bold text-foreground">{currency} {(project.default_model_fee || 0).toLocaleString()}</span> {feeType} por modelo
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-white/60 dark:bg-black/20 rounded-lg">
                        <p className="text-2xl font-black text-green-600">{approvedModels.length}</p>
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Aprobados</p>
                    </div>
                    <div className="text-center p-3 bg-white/60 dark:bg-black/20 rounded-lg">
                        <p className="text-2xl font-black text-amber-600">{pendingModels.length}</p>
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Pendientes</p>
                    </div>
                    <div className="text-center p-3 bg-white/60 dark:bg-black/20 rounded-lg">
                        <p className="text-2xl font-black">{selectedModels.length}</p>
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total</p>
                    </div>
                </div>

                <Separator className="bg-blue-200 dark:bg-blue-700" />

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Confirmado (aprobados):</span>
                        <span className="text-xl font-black text-green-600">
                            {currency} {totalApproved.toLocaleString()}
                        </span>
                    </div>
                    {estimatedPending > 0 && (
                        <div className="flex justify-between items-center opacity-70">
                            <span className="text-sm text-muted-foreground italic">Estimado pendiente:</span>
                            <span className="text-lg font-semibold text-amber-600">
                                + {currency} {estimatedPending.toLocaleString()}
                            </span>
                        </div>
                    )}
                </div>

                {approvedModels.length > 0 && (
                    <>
                        <Separator className="bg-blue-200 dark:bg-blue-700" />
                        <div className="text-xs text-muted-foreground">
                            <p className="font-semibold mb-1">Desglose de modelos aprobados:</p>
                            {approvedModels.map(model => {
                                const fee = model.agreed_fee || project.default_model_fee || 0;
                                const days = model.assignments?.length || 1;
                                return (
                                    <div key={model.id} className="flex justify-between py-0.5">
                                        <span>{model.alias} ({days} día{days > 1 ? 's' : ''})</span>
                                        <span className="font-mono">{currency} {(fee * days).toLocaleString()}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

const PaymentEditorPopover = ({
    model,
    project,
    onRefresh,
    onPaymentChange
}: {
    model: Model,
    project: Project,
    onRefresh?: () => void,
    onPaymentChange?: (modelId: string, fee: number, feeType: string, currency: string) => void
}) => {
    const [fee, setFee] = useState(model.agreed_fee?.toString() || '0');
    const [feeType, setFeeType] = useState(model.fee_type || 'per_day');
    const [currency, setCurrency] = useState(model.currency || 'GTQ');
    const [isUpdating, setIsUpdating] = useState(false);
    const [open, setOpen] = useState(false);

    const handleSave = async () => {
        setIsUpdating(true);
        const parsedFee = parseFloat(fee);
        const result = await updateModelPaymentDetail(project.id, model.id, {
            agreed_fee: parsedFee,
            fee_type: feeType,
            currency: currency
        });
        if (result.success) {
            toast.success('Pago actualizado correctamente.');
            // Actualización optimista del estado local
            onPaymentChange?.(model.id, parsedFee, feeType, currency);
            setOpen(false);
            onRefresh?.();
        } else {
            toast.error(result.error || 'Error al actualizar pago.');
        }
        setIsUpdating(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button size="icon" variant="outline" className="h-8 w-8" title="Editar Pago">
                    <Banknote className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
                <div className="space-y-4">
                    <div className="space-y-1">
                        <h4 className="font-medium text-copy-14">Detalles de Pago</h4>
                        <p className="text-label-12 text-muted-foreground">Ajusta la tarifa individual para {model.alias}.</p>
                    </div>

                    <div className="grid gap-3">
                        <div className="grid gap-2">
                            <Label htmlFor="fee">Tarifa</Label>
                            <Input
                                id="fee"
                                type="number"
                                value={fee}
                                onChange={(e) => setFee(e.target.value)}
                                className="h-9"
                            />
                        </div>

                        <div className="grid gap-2">
                            <div className="flex items-center gap-1.5">
                                <Label>Tipo de Pago</Label>
                                <TooltipProvider>
                                    <Tooltip delayDuration={100}>
                                        <TooltipTrigger asChild>
                                            <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                                                <Info className="h-3 w-3" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-xs p-3 text-sm">
                                            <p className="font-semibold mb-2">¿Cuál elegir?</p>
                                            <ul className="space-y-1 text-xs">
                                                <li><strong>Por día:</strong> Según días trabajados.</li>
                                                <li><strong>Por hora:</strong> Según horas trabajadas.</li>
                                                <li><strong>Tarifa fija:</strong> Pago único por el proyecto.</li>
                                            </ul>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <Select value={feeType} onValueChange={setFeeType}>
                                <SelectTrigger className="h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="per_day">Por día</SelectItem>
                                    <SelectItem value="per_hour">Por hora</SelectItem>
                                    <SelectItem value="fixed">Tarifa fija</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label>Moneda</Label>
                            <Select value={currency} onValueChange={setCurrency}>
                                <SelectTrigger className="h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="GTQ">GTQ</SelectItem>
                                    <SelectItem value="USD">USD</SelectItem>
                                    <SelectItem value="EUR">EUR</SelectItem>
                                    <SelectItem value="MXN">MXN</SelectItem>
                                    <SelectItem value="COP">COP</SelectItem>
                                    <SelectItem value="PEN">PEN</SelectItem>
                                    <SelectItem value="ARS">ARS</SelectItem>
                                    <SelectItem value="CLP">CLP</SelectItem>
                                    <SelectItem value="BRL">BRL</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Button className="w-full" size="sm" onClick={handleSave} disabled={isUpdating}>
                        {isUpdating ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Save className="mr-2 h-3 w-3" />}
                        Guardar Cambios
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};

const TalentRow = ({ model, project, onAction, isPending, actionType, onRefresh, onAssignmentChange, onPaymentChange }: {
    model: Model;
    project: Project;
    onAction: () => void;
    isPending: boolean;
    actionType: 'add' | 'remove';
    onRefresh?: () => void;
    onAssignmentChange?: (modelId: string, scheduleId: string, assigned: boolean) => void;
    onPaymentChange?: (modelId: string, fee: number, feeType: string, currency: string) => void;
}) => {
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
        <div className="flex flex-col gap-2 p-2 hover:bg-muted/50 rounded-md transition-colors">
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage src={model.coverUrl || `${SUPABASE_PUBLIC_URL}${model.id}/Portada/cover.jpg`} />
                    <AvatarFallback>{model.alias?.substring(0, 2) || 'IZ'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="text-label-14 font-medium truncate">{model.alias}</p>
                        {actionType === 'remove' && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1 leading-none font-mono">
                                {model.currency} {model.agreed_fee} {model.fee_type === 'per_day' ? '/d' : model.fee_type === 'per_hour' ? '/h' : ''}
                            </Badge>
                        )}
                    </div>
                    <p className="text-label-13 text-muted-foreground truncate">{model.country}</p>
                </div>

                <div className="flex items-center gap-2">
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
                                            <h4 className="font-medium text-copy-14">Asignar Horarios</h4>
                                            <p className="text-label-12 text-muted-foreground">Define cuándo estará presente el talento.</p>
                                        </div>
                                        <div className="space-y-3">
                                            {(() => {
                                                const scheduleItems = project.schedule || [];
                                                const hasValidIds = scheduleItems.some(item => !!item.id);

                                                if (scheduleItems.length > 0 && !hasValidIds) {
                                                    return (
                                                        <div className="space-y-3">
                                                            <p className="text-label-12 text-blue-600 bg-blue-50 p-2 rounded-md border border-blue-100 italic">
                                                                Los horarios de este proyecto necesitan activarse para poder asignar modelos.
                                                            </p>
                                                            <Button
                                                                size="sm"
                                                                className="w-full h-8 text-label-12"
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
                                                        <p className="text-label-12 text-muted-foreground italic">No hay horarios definidos en el proyecto.</p>
                                                    );
                                                }

                                                return scheduleItems.map((item, _idx) => {
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
                                                                className="text-label-13 cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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
                            actionType === 'add' ? <PlusCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-destructive" />
                        )}
                    </Button>
                </div>
            </div>

            {actionType === 'remove' && model.assignments && model.assignments.length > 0 && (
                <div className="flex flex-wrap gap-1.5 ml-[52px]">
                    {model.assignments.map(a => {
                        const scheduleItem = project.schedule?.find(s => s.id === a.schedule_id);
                        if (!scheduleItem) return null;
                        const dateObj = new Date(`${scheduleItem.date}T00:00:00`);
                        return (
                            <Badge key={a.id} variant="secondary" className="text-[10px] h-5 px-1.5 font-normal bg-blue-500/10 text-blue-600 border-blue-500/20">
                                {dateObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}
                            </Badge>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const DangerZone = ({ project }: { project: Project }) => (
    <Card className="border-destructive">
        <CardHeader>
            <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
            <CardDescription>Estas acciones son permanentes y no se pueden deshacer.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-between rounded-lg border border-destructive bg-destructive/5 p-4">
                <div>
                    <p className="text-label-14 text-foreground">Eliminar este proyecto</p>
                    <p className="text-label-13 text-muted-foreground">Toda la información y selección de talentos se perderá.</p>
                </div>
                <DeleteProjectDialog projectId={project.id} projectName={project.project_name || 'este proyecto'}>
                    <Button variant="destructive">Eliminar</Button>
                </DeleteProjectDialog>
            </div>
        </CardContent>
    </Card>
);

interface ProjectDetailClientProps {
    project: Project;
    initialSelectedModels: Model[];
    allModels: Model[];
}

// Helper para convertir hora 12h a minutos totales para ordenamiento
const timeToMinutes = (timeStr: string) => {
    const parts = timeStr.split(' ');
    if (parts.length < 2) return 0;
    const [time, period] = parts;
    const [hoursStr, minutesStr] = time.split(':');
    let hours = Number(hoursStr);
    const minutes = Number(minutesStr);
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
};

// Helper para formatear fechas y horarios
const formatSchedule = (schedule: Project['schedule']) => {
    if (!schedule || !Array.isArray(schedule) || schedule.length === 0) return null;

    const groupedByDate: Record<string, { startTime: string; endTime: string }[]> = {};
    schedule.forEach(item => {
        if (item?.date && item.startTime && item.endTime) {
            if (!groupedByDate[item.date]) groupedByDate[item.date] = [];
            groupedByDate[item.date].push({ startTime: item.startTime, endTime: item.endTime });
        }
    });

    const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    return sortedDates.map(dateStr => {
        const horarios = groupedByDate[dateStr]
            .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
            .map(h => `${h.startTime} - ${h.endTime}`)
            .join(' | ');

        const dateObj = new Date(`${dateStr}T00:00:00`);
        const formattedDate = dateObj.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
        });

        return (
            <div key={dateStr} className="flex items-center gap-2 text-label-13 text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border border-border/50">
                <Clock className="size-3.5" />
                <span className="font-medium capitalize">{formattedDate}:</span>
                <span className="font-mono">{horarios}</span>
            </div>
        );
    });
};

export default function ProjectDetailClient({ project: initialProject, initialSelectedModels, allModels }: ProjectDetailClientProps) {
    const router = useRouter();
    const [project, setProject] = useState(initialProject);
    const [selectedModels, setSelectedModels] = useState(initialSelectedModels);
    const [searchQuery, setSearchQuery] = useState('');
    const [isPending, startTransition] = useTransition();
    const [isEditing, setIsEditing] = useState(false);

    // Sincronizar estado cuando los props cambian (después de router.refresh())
    useEffect(() => {
        setProject(initialProject);
        setSelectedModels(initialSelectedModels);
    }, [initialProject, initialSelectedModels]);

    const handleRefresh = () => {
        router.refresh();
    };

    const handleStatusChange = (newStatus: Project['status']) => {
        setProject(currentProject => ({ ...currentProject, status: newStatus }));
    };

    // Verificar auto-cierre de proyecto al cargar
    useEffect(() => {
        const checkAutoClose = async () => {
            if (project.status === 'completed' || project.status === 'archived') return;

            const result = await autoCloseExpiredProject(project.id);
            if (result.closed) {
                toast.info('Este proyecto ha sido cerrado automáticamente porque pasó su fecha final.', {
                    description: 'Los modelos pendientes fueron marcados como rechazados.',
                    duration: 6000,
                });
                setProject(prev => ({ ...prev, status: 'completed' }));
                // Actualizar modelos pendientes a rechazados en el estado local
                setSelectedModels(prev => prev.map(m =>
                    m.client_selection === 'pending'
                        ? { ...m, client_selection: 'rejected' }
                        : m
                ));
            }
        };
        checkAutoClose();
    }, [project.id, project.status]);

    const scheduleElements = formatSchedule(project.schedule);


    const availableModels = useMemo(() => {
        const selectedIds = new Set(selectedModels.map(m => m.id));
        return allModels
            .filter(model => !selectedIds.has(model.id))
            .filter(model =>
                model.alias?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                model.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
            );
    }, [allModels, selectedModels, searchQuery]);

    const handleAddModel = (modelId: string) => {
        startTransition(async () => {
            // Optimistic update ANTES de la llamada al servidor
            const modelToAdd = allModels.find(m => m.id === modelId);
            if (modelToAdd) {
                setSelectedModels(prev => [...prev, {
                    ...modelToAdd,
                    client_selection: 'pending',
                    agreed_fee: project.default_model_fee || 0,
                    fee_type: project.default_fee_type || 'per_day',
                    currency: project.currency || 'GTQ',
                    assignments: []
                }]);
            }

            const result = await addModelToProject(project.id, modelId);
            if (result.success) {
                toast.success(`Talento añadido a ${project.project_name}`);
            } else {
                // Revertir si falla
                if (modelToAdd) {
                    setSelectedModels(prev => prev.filter(m => m.id !== modelId));
                }
                toast.error(result.error || "Error desconocido al añadir");
            }
        });
    };

    // Función para manejar cambios en asignaciones de horario
    const handleAssignmentChange = (modelId: string, scheduleId: string, assigned: boolean) => {
        setSelectedModels(prev => prev.map(model => {
            if (model.id !== modelId) return model;

            const currentAssignments = model.assignments || [];

            if (assigned) {
                // Agregar la asignación
                const newAssignment = {
                    id: `temp-${Date.now()}`, // ID temporal hasta que se refresque
                    schedule_id: scheduleId,
                    model_id: modelId,
                    project_id: project.id, // Nuevo campo requerido
                    is_confirmed: null,
                    created_at: new Date().toISOString(),
                    // Nuevos campos de pago (defaults)
                    daily_fee: null,
                    hours_worked: null,
                    adjustment_amount: 0,
                    adjustment_reason: null,
                    payment_status: 'pending',
                    payment_date: null,
                    notes: null,
                };
                return {
                    ...model,
                    assignments: [...currentAssignments, newAssignment]
                };
            } else {
                // Eliminar la asignación
                return {
                    ...model,
                    assignments: currentAssignments.filter(a => a.schedule_id !== scheduleId)
                };
            }
        }));
    };

    // Función para manejar la cancelación o finalización de la edición
    const handleEditFinish = () => {
        setIsEditing(false);
        // Podríamos querer recargar los datos del proyecto aquí
    }

    if (isEditing) {
        return (
            <div className="p-8 md:p-12 space-y-8">
                <ProjectForm initialData={project} onCancel={handleEditFinish} />
            </div>
        );
    }

    return (
        <div className="p-8 md:p-12 space-y-8">
            <header className="flex flex-col items-start gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                    <Button variant="outline" size="icon" className="mt-1 flex-shrink-0" asChild>
                        <Link href="/dashboard/projects">
                            <ChevronLeft className="h-4 w-4" />
                            <span className="sr-only">Volver a Proyectos</span>
                        </Link>
                    </Button>
                    <div className="space-y-4">
                        <div>
                            <h1 className="text-heading-32">{project.project_name}</h1>
                            <p className="text-muted-foreground font-medium">Cliente: {project.client_name || 'No especificado'}</p>
                        </div>

                        {scheduleElements && (
                            <div className="flex flex-wrap gap-2">
                                {scheduleElements}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                    <Button variant="outline" asChild className="flex-grow sm:flex-grow-0">
                        <Link href={`/c/${project.id}`} target="_blank"><Eye className="mr-2 h-4 w-4" /> Previsualizar</Link>
                    </Button>
                    <Button onClick={() => setIsEditing(true)} variant="outline" className="flex-grow sm:flex-grow-0">
                        <Pencil className="mr-2 h-4 w-4" /> Editar Proyecto
                    </Button>
                    <ShareProjectDialog project={project} onStatusChange={handleStatusChange}>
                        <Button className="flex-grow sm:flex-grow-0"><Share2 className="mr-2 h-4 w-4" /> Compartir</Button>
                    </ShareProjectDialog>
                </div>
            </header>


            <ProjectStatusUpdater project={project} selectedModels={selectedModels} />

            {/* Resumen de Presupuesto */}
            <BudgetSummaryCard project={project} selectedModels={selectedModels} />

            <div className="grid md:grid-cols-[30%_1fr] gap-6 items-start">
                <Card>
                    <CardHeader>
                        <CardTitle>Selección de Talentos</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Buscar talento por nombre o alias..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        </div>
                        <Separator />
                        <ScrollArea className="h-96">
                            <div className="space-y-2 pr-4">
                                {availableModels.length > 0 ? availableModels.map(model => (
                                    <TalentRow
                                        key={model.id}
                                        model={model}
                                        project={project}
                                        onAction={() => handleAddModel(model.id)}
                                        isPending={isPending}
                                        actionType="add"
                                        onRefresh={handleRefresh}
                                    />
                                )) : (
                                    <p className="text-center text-copy-14 text-muted-foreground py-4">No hay más talentos disponibles o que coincidan.</p>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Panel unificado de Talentos con Grid de Asignaciones */}
                <TalentAssignmentPanel
                    project={project}
                    models={selectedModels}
                    onAssignmentChange={handleAssignmentChange}
                    onModelRemoved={(_modelId) => {
                        // El componente ya maneja el refresh internamente
                    }}
                    onSelectionChange={(modelId, status) => {
                        // Actualizar estado local para feedback inmediato
                        setSelectedModels(prev => prev.map(m =>
                            m.id === modelId ? { ...m, client_selection: status } : m
                        ));
                    }}
                    onRefresh={handleRefresh}
                />
            </div>

            <DangerZone project={project} />
        </div>
    );
}