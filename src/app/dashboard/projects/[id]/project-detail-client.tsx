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
import { BackButton } from '@/components/molecules/BackButton';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ProjectStatusBadge } from '@/components/molecules/ProjectStatusBadge';
import { ScheduleChips } from '@/components/molecules/ScheduleChips';
import { SearchBar } from '@/components/molecules/SearchBar';
import { ShareProjectDialog } from '@/components/organisms/ShareProjectDialog';
import { DeleteProjectDialog } from '@/components/organisms/DeleteProjectDialog';
import { ProjectStatusUpdater } from '@/components/organisms/ProjectStatusUpdater';
import {
    PlusCircle, XCircle, Loader2, Share2, Eye,
    Pencil,
    CalendarCheck2, Banknote, Save, Calculator, Info, Copy, ChevronDown
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';


const ClientStatusBadge = ({ status }: { status: Model['client_selection'] }) => {
    return <ProjectStatusBadge status={status || 'pending'} size="small" />;
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
        <Card className="bg-muted/30 border">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-x-2 gap-y-2 text-primary">
                    <Calculator className="h-5 w-5" />
                    Resumen de Presupuesto
                </CardTitle>
                <CardDescription>
                    Tarifa base: <span className="font-bold text-foreground">{currency} {(project.default_model_fee || 0).toLocaleString()}</span> {feeType} por modelo
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-x-4 gap-y-4">
                    <div className="text-center p-3 bg-white/60 dark:bg-black/20 rounded-lg">
                        <p className="text-display font-black text-success">{approvedModels.length}</p>
                        <p className="text-label text-muted-foreground uppercase font-bold tracking-wider">Aprobados</p>
                    </div>
                    <div className="text-center p-3 bg-white/60 dark:bg-black/20 rounded-lg">
                        <p className="text-display font-black text-warning">{pendingModels.length}</p>
                        <p className="text-label text-muted-foreground uppercase font-bold tracking-wider">Pendientes</p>
                    </div>
                    <div className="text-center p-3 bg-white/60 dark:bg-black/20 rounded-lg">
                        <p className="text-display font-black">{selectedModels.length}</p>
                        <p className="text-label text-muted-foreground uppercase font-bold tracking-wider">Total</p>
                    </div>
                </div>

                <Separator />

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-body text-muted-foreground">Total Confirmado (aprobados):</span>
                        <span className="text-title font-black text-success">
                            {currency} {totalApproved.toLocaleString()}
                        </span>
                    </div>
                    {estimatedPending > 0 && (
                        <div className="flex justify-between items-center opacity-70">
                            <span className="text-body text-muted-foreground italic">Estimado pendiente:</span>
                            <span className="text-body font-semibold text-warning">
                                + {currency} {estimatedPending.toLocaleString()}
                            </span>
                        </div>
                    )}
                </div>

                {approvedModels.length > 0 && (
                    <>
                        <Separator />
                        <div className="text-label text-muted-foreground">
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
                        <h4 className="font-medium text-body">Detalles de Pago</h4>
                        <p className="text-label text-muted-foreground">Ajusta la tarifa individual para {model.alias}.</p>
                    </div>

                    <div className="grid gap-x-3 gap-y-3">
                        <div className="grid gap-x-2 gap-y-2">
                            <Label htmlFor="fee">Tarifa</Label>
                            <Input
                                id="fee"
                                type="number"
                                value={fee}
                                onChange={(e) => setFee(e.target.value)}
                                className="h-9"
                            />
                        </div>

                        <div className="grid gap-x-2 gap-y-2">
                            <div className="flex items-center gap-x-2 gap-y-2">
                                <Label>Tipo de Pago</Label>
                                <TooltipProvider>
                                    <Tooltip delayDuration={100}>
                                        <TooltipTrigger asChild>
                                            <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                                                <Info className="h-3 w-3" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-xs p-3 text-body">
                                            <p className="font-semibold mb-2">¿Cuál elegir?</p>
                                            <ul className="space-y-1 text-label">
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

                        <div className="grid gap-x-2 gap-y-2">
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
        <div className="flex flex-col gap-y-2 p-2 hover:bg-muted/50 rounded-md transition-colors">
            <div className="flex items-center gap-x-3 gap-y-3">
                <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage src={model.coverUrl || `${SUPABASE_PUBLIC_URL}${model.id}/Portada/cover.jpg`} />
                    <AvatarFallback>{model.alias?.substring(0, 2) || 'IZ'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-x-2 gap-y-2">
                        <p className="text-body font-medium truncate">{model.alias}</p>
                        {actionType === 'remove' && (
                            <Badge variant="outline" size="small" className="font-mono">
                                {model.currency} {model.agreed_fee} {model.fee_type === 'per_day' ? '/d' : model.fee_type === 'per_hour' ? '/h' : ''}
                            </Badge>
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
};

const DangerZone = ({ project }: { project: Project }) => {
    const [open, setOpen] = useState(false);

    const handleCopyId = () => {
        navigator.clipboard.writeText(project.id);
        toast.success('UUID copiado al portapapeles');
    };

    return (
        <div className="space-y-4">
            <Collapsible open={open} onOpenChange={setOpen}>
                <Card className="border-destructive">
                    <CardHeader className="flex flex-row items-start justify-between gap-3">
                        <div className="min-w-0">
                            <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
                            <CardDescription className="text-destructive/80">Estas acciones son permanentes y no se pueden deshacer.</CardDescription>
                        </div>
                        <CollapsibleTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="shrink-0"
                                aria-label={open ? 'Cerrar zona de peligro' : 'Abrir zona de peligro'}
                                title={open ? 'Cerrar' : 'Abrir'}
                            >
                                <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                            </Button>
                        </CollapsibleTrigger>
                    </CardHeader>
                    <CollapsibleContent>
                        <CardContent>
                            <div className="flex items-center justify-between rounded-lg border border-destructive bg-destructive/5 p-4">
                                <div>
                                    <p className="text-body text-foreground">Eliminar este proyecto</p>
                                    <p className="text-label text-muted-foreground">Toda la información y selección de talentos se perderá.</p>
                                </div>
                                <DeleteProjectDialog projectId={project.id} projectName={project.project_name || 'este proyecto'}>
                                    <Button variant="destructive">Eliminar</Button>
                                </DeleteProjectDialog>
                            </div>
                        </CardContent>
                    </CollapsibleContent>
                </Card>
            </Collapsible>

            {/* UUID del proyecto */}
            <div className="flex items-center justify-center gap-2 pt-2">
                <span className="text-label text-muted-foreground font-mono">{project.id}</span>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={handleCopyId}
                    title="Copiar UUID"
                >
                    <Copy className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    );
};

interface ProjectDetailClientProps {
    project: Project;
    initialSelectedModels: Model[];
    allModels: Model[];
}


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

    const hasSchedule = Array.isArray(project.schedule) && project.schedule.length > 0;


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
            <div className="space-y-6">
                <ProjectForm initialData={project} onCancel={handleEditFinish} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <header className="flex flex-col gap-x-4 gap-y-4 pb-4 border-b sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <BackButton href="/dashboard/projects" label="Volver a Proyectos" />
                    <h1 className="text-display font-semibold">Proyecto</h1>
                </div>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-2 shrink-0 w-full sm:w-auto">
                    <Button variant="outline" asChild className="grow sm:grow-0">
                        <Link href={`/c/${project.id}`} target="_blank"><Eye className="mr-2 h-4 w-4" /> Previsualizar</Link>
                    </Button>
                    <Button onClick={() => setIsEditing(true)} variant="outline" className="grow sm:grow-0">
                        <Pencil className="mr-2 h-4 w-4" /> Editar Proyecto
                    </Button>
                    <ShareProjectDialog project={project} onStatusChange={handleStatusChange}>
                        <Button className="grow sm:grow-0"><Share2 className="mr-2 h-4 w-4" /> Compartir</Button>
                    </ShareProjectDialog>
                </div>
            </header>

            <Card>
                <CardHeader className="space-y-1">
                    <CardTitle className="text-title font-semibold">{project.project_name}</CardTitle>
                    <CardDescription className="text-body">Cliente: {project.client_name || 'No especificado'}</CardDescription>
                </CardHeader>
                {hasSchedule && (
                    <CardContent>
                        <ScheduleChips schedule={project.schedule} />
                    </CardContent>
                )}
            </Card>


            <ProjectStatusUpdater project={project} selectedModels={selectedModels} />

            {/* Resumen de Presupuesto */}
            <BudgetSummaryCard project={project} selectedModels={selectedModels} />

            <div className="grid md:grid-cols-[30%_1fr] gap-6 items-start">
                <Card>
                    <CardHeader>
                        <CardTitle>Selección de Talentos</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <SearchBar
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                            onClear={() => setSearchQuery('')}
                            placeholder="Buscar talento por nombre o alias..."
                            ariaLabel="Buscar talento"
                            inputClassName="h-9"
                        />
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
                                    <p className="text-center text-body text-muted-foreground py-4">No hay más talentos disponibles o que coincidan.</p>
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
                    onModelRemoved={() => { }}
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