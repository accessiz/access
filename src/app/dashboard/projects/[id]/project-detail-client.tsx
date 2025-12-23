'use client'

import { useState, useTransition, useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Model, Project } from '@/lib/types';
import { addModelToProject, removeModelFromProject } from '@/lib/actions/projects_models';
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
    CalendarCheck2, CalendarX2
} from 'lucide-react';
import { ProjectForm } from '@/components/organisms/ProjectForm';
import { assignModelToSchedule, unassignModelFromSchedule } from '@/lib/actions/projects_models';
import { syncProjectSchedule } from '@/lib/actions/projects';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';


const ClientStatusBadge = ({ status }: { status: Model['client_selection'] }) => {
    if (status === 'approved') {
        return <Badge variant="outline" className="border-green-500 text-green-500 bg-green-500/10"><CheckCircle2 className="mr-1 h-3 w-3" /> Aprobado</Badge>;
    }
    if (status === 'rejected') {
        return <Badge variant="outline" className="border-red-500 text-red-500 bg-red-500/10"><XCircleIcon className="mr-1 h-3 w-3" /> Rechazado</Badge>;
    }
    return <Badge variant="outline"><Clock className="mr-1 h-3 w-3" /> Pendiente</Badge>;
};

const TalentRow = ({ model, project, onAction, isPending, actionType }: {
    model: Model;
    project: Project;
    onAction: () => void;
    isPending: boolean;
    actionType: 'add' | 'remove';
}) => {
    const [isAssigning, setIsAssigning] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    const handleToggleAssignment = async (scheduleId: string, currentAssigned: boolean) => {
        setIsAssigning(true);
        if (currentAssigned) {
            await unassignModelFromSchedule(scheduleId, model.id, project.id);
        } else {
            await assignModelToSchedule(scheduleId, model.id, project.id);
        }
        setIsAssigning(false);
    };

    const handleSync = async () => {
        setIsSyncing(true);
        const result = await syncProjectSchedule(project.id);
        if (result.success) {
            toast.success('Horarios sincronizados correctamente.');
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
                    <p className="text-label-14 font-medium truncate">{model.alias}</p>
                    <p className="text-label-13 text-muted-foreground truncate">{model.country}</p>
                </div>

                <div className="flex items-center gap-2">
                    {actionType === 'remove' && (
                        <>
                            <ClientStatusBadge status={model.client_selection} />

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

                                                return scheduleItems.map((item, idx) => {
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
    let [hours, minutes] = time.split(':').map(Number);
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
    const [project, setProject] = useState(initialProject);
    const [selectedModels, setSelectedModels] = useState(initialSelectedModels);
    const [searchQuery, setSearchQuery] = useState('');
    const [isPending, startTransition] = useTransition();
    const [isEditing, setIsEditing] = useState(false);

    const handleStatusChange = (newStatus: Project['status']) => {
        setProject(currentProject => ({ ...currentProject, status: newStatus }));
    };

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
            const result = await addModelToProject(project.id, modelId);
            if (result.success) {
                const modelToAdd = allModels.find(m => m.id === modelId);
                if (modelToAdd) setSelectedModels(prev => [...prev, { ...modelToAdd, client_selection: 'pending' }]);
                toast.success(`Talento añadido a ${project.project_name}`);
            } else { toast.error(result.error || "Error desconocido al añadir"); }
        });
    };

    const handleRemoveModel = (modelId: string) => {
        startTransition(async () => {
            const result = await removeModelFromProject(project.id, modelId);
            if (result.success) {
                setSelectedModels(prev => prev.filter(m => m.id !== modelId));
                toast.success(`Talento quitado de ${project.project_name}`);
            } else { toast.error(result.error || "Error desconocido al quitar"); }
        });
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

            <div className="grid md:grid-cols-2 gap-8 items-start">
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
                                    />
                                )) : (
                                    <p className="text-center text-copy-14 text-muted-foreground py-4">No hay más talentos disponibles o que coincidan.</p>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Talentos en el Proyecto</CardTitle>
                        <CardDescription>Hay {selectedModels.length} talento(s) en esta selección.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[28.5rem]">
                            <div className="space-y-2 pr-4">
                                {selectedModels.length > 0 ? selectedModels.map(model => (
                                    <TalentRow
                                        key={model.id}
                                        model={model}
                                        project={project}
                                        onAction={() => handleRemoveModel(model.id)}
                                        isPending={isPending}
                                        actionType="remove"
                                    />
                                )) : (
                                    <p className="text-center text-copy-14 text-muted-foreground py-4">Aún no has añadido talentos.</p>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            <DangerZone project={project} />
        </div>
    );
}