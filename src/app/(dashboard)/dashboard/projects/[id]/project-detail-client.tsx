'use client'; // HMR Fix


import * as React from 'react';
import { useState, useTransition, useMemo, useEffect } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Model, Project } from '@/lib/types';
import { addModelToProject } from '@/lib/actions/projects_models';
import { autoCloseExpiredProject } from '@/lib/actions/projects';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/molecules/BackButton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ScheduleChips } from '@/components/molecules/ScheduleChips';
import { SearchBar } from '@/components/molecules/SearchBar';

import { ShareProjectDialog } from '@/components/organisms/ShareProjectDialog';
import { ProjectStatusUpdater } from '@/components/organisms/ProjectStatusUpdater';
import { Share2, Eye, Pencil, ChevronDown } from 'lucide-react';
import { ProjectForm } from '@/components/organisms/ProjectForm';
import { TalentAssignmentPanel } from '@/components/organisms/TalentAssignmentPanel';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Co-located sections (conventions.md pattern)
import { BudgetSummaryCard } from './_budget-summary/BudgetSummary';
import { TalentRow } from './_talent-row/TalentRow';
import { DangerZone } from './_danger-zone/DangerZone';


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
    const [scheduleOpen, setScheduleOpen] = useState(false);

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
                    trade_fee: project.default_model_trade_fee || 0, // Init trade fee
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
                    adjustment_amount_trade: 0,
                    adjustment_reason: null,
                    adjustment_reason_trade: null,
                    payment_status: 'pending' as const,
                    payment_date: null,
                    payment_type: null,
                    trade_description: null,
                    trade_category: null,
                    trade_details: null,
                    trade_fee: null,
                    notes: null,
                    // Currency conversion fields
                    amount_gtq: null,
                    exchange_rate_used: null,
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
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                        <h1 className="text-display font-semibold">{project.project_name}</h1>
                        {project.client_name && (
                            <>
                                <span className="hidden sm:inline text-muted-foreground">|</span>
                                <span className="text-body text-muted-foreground">{project.client_name}</span>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-2 shrink-0 w-full sm:w-auto">
                    <Button variant="outline" asChild className="grow sm:grow-0">
                        <Link href={`/c/${project.id}`} target="_blank"><Eye className="mr-2 h-4 w-4" /> Previsualizar</Link>
                    </Button>
                    <Button onClick={() => setIsEditing(true)} variant="outline" className="grow sm:grow-0">
                        <Pencil className="mr-2 h-4 w-4" /> Editar Proyecto
                    </Button>
                    <ShareProjectDialog project={project} onStatusChange={handleStatusChange} selectedModels={selectedModels}>
                        <Button className="grow sm:grow-0"><Share2 className="mr-2 h-4 w-4" /> Compartir</Button>
                    </ShareProjectDialog>
                </div>
            </header>

            <Card>
                <Collapsible open={scheduleOpen} onOpenChange={setScheduleOpen}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-title font-semibold">Horarios</CardTitle>

                        <CollapsibleTrigger asChild>
                            <button
                                type="button"
                                className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-transparent border border-separator hover:bg-hover-overlay transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                aria-label={scheduleOpen ? 'Contraer horarios' : 'Expandir horarios'}
                            >
                                <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${scheduleOpen ? 'rotate-180' : ''}`} />
                            </button>
                        </CollapsibleTrigger>
                    </CardHeader>

                    {hasSchedule && (
                        <CollapsibleContent asChild>
                            <CardContent>
                                <ScheduleChips schedule={project.schedule} fullWidth />
                            </CardContent>
                        </CollapsibleContent>
                    )}
                </Collapsible>
            </Card>


            <ProjectStatusUpdater project={project} selectedModels={selectedModels} />

            {/* Resumen de Presupuesto */}
            <BudgetSummaryCard project={project} selectedModels={selectedModels} onRefresh={handleRefresh} />

            <div className="grid md:grid-cols-[30%_1fr] gap-6 items-start">
                <Card className="flex flex-col h-full">
                    <CardHeader>
                        <CardTitle>Selección de Talentos</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4 flex-1 flex flex-col min-h-0">
                        <SearchBar
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                            onClear={() => setSearchQuery('')}
                            placeholder="Buscar talento por nombre o alias..."
                            ariaLabel="Buscar talento"
                            inputClassName="h-9"
                        />
                        <Separator />
                        <ScrollArea className="h-[500px]">
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