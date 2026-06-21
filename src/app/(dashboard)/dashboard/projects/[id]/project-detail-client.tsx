'use client'; // HMR Fix


import * as React from 'react';
import { useState, useTransition, useMemo, useEffect, useRef } from 'react';
import { useDebouncedCallback } from 'use-debounce';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Model, Project } from '@/lib/types';
import type { ModelPickerItem } from '@/lib/api/models';
import { addModelToProject } from '@/lib/actions/projects_models';
import { autoCloseExpiredProject } from '@/lib/actions/projects';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/molecules/BackButton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ScheduleChips } from '@/components/molecules/ScheduleChips';
import { SearchBar } from '@/components/molecules/SearchBar';

import { ProjectStatusUpdater } from '@/components/organisms/ProjectStatusUpdater';
import { Eye, Pencil, ChevronDown, ChevronLeft, ChevronRight, Calendar, Copy, Check, Link2, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProjectForm } from '@/components/organisms/ProjectForm';
import { TalentAssignmentPanel } from '@/components/organisms/TalentAssignmentPanel';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

// Co-located sections (conventions.md pattern)
import { BudgetSummaryCard } from './_budget-summary/BudgetSummary';
import { TalentRow } from './_talent-row/TalentRow';
import { DangerZone } from './_danger-zone/DangerZone';
import { ProjectLinksCard } from './_project-links/ProjectLinksCard';



function capitalizeFirstLetter(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function renderFormattedActivity(
    text: string,
    clientName: string | null | undefined,
    selectedModels: any[] = [],
    availableModels: any[] = []
) {
    if (!text) return null;

    let processedText = text;
    const clientPlaceholder = clientName || 'Cliente';
    
    // Replace leading "Cliente" (case-insensitive) with client name, or just highlight it
    if (processedText.toLowerCase().startsWith('cliente')) {
        processedText = clientPlaceholder + processedText.substring(7);
    } else {
        processedText = processedText.replace(/\bCliente\b/g, clientPlaceholder);
    }

    processedText = capitalizeFirstLetter(processedText);

    // Extract unique model names to highlight
    const modelNamesSet = new Set<string>();
    selectedModels.forEach(m => {
        if (m.alias) modelNamesSet.add(m.alias.trim());
        if (m.full_name) modelNamesSet.add(m.full_name.trim());
    });
    availableModels.forEach(m => {
        if (m.alias) modelNamesSet.add(m.alias.trim());
        if (m.full_name) modelNamesSet.add(m.full_name.trim());
    });

    const modelNames = Array.from(modelNamesSet)
        .filter(name => name.length > 1)
        .sort((a, b) => b.length - a.length);

    const clientNames = [clientPlaceholder].filter(Boolean) as string[];

    const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const allNames = [...modelNames, ...clientNames]
        .map(escapeRegExp)
        .filter(Boolean);

    if (allNames.length === 0) {
        return <span>{processedText}</span>;
    }

    const nameRegex = new RegExp(`\\b(${allNames.join('|')})\\b`, 'gi');
    
    // Split by quotes to avoid matching inside project/proposal names
    const quoteSegments = processedText.split('"');

    return (
        <span>
            {quoteSegments.map((segment, segIndex) => {
                if (segIndex % 2 === 1) {
                    return `"${segment}"`;
                }

                const parts = segment.split(nameRegex);
                return (
                    <React.Fragment key={segIndex}>
                        {parts.map((part, partIndex) => {
                            const matchedModelName = modelNames.find(
                                name => name.toLowerCase() === part.toLowerCase()
                            );
                            const matchedClientName = clientNames.find(
                                name => name.toLowerCase() === part.toLowerCase()
                            );

                            if (matchedModelName) {
                                return (
                                    <span key={partIndex} className="text-purple font-semibold">
                                        {part}
                                    </span>
                                );
                            } else if (matchedClientName) {
                                return (
                                    <span key={partIndex} className="text-blue font-semibold">
                                        {part}
                                    </span>
                                );
                            } else {
                                return part;
                            }
                        })}
                    </React.Fragment>
                );
            })}
        </span>
    );
}

interface ProjectDetailClientProps {
    project: Project;
    initialSelectedModels: Model[];
    availableModels: ModelPickerItem[];
    availableModelsCount: number;
    availableModelsCurrentPage: number;
    availableModelsTotalPages: number;
    initialTalentQuery: string;
    activityLogs?: any[];
}


export default function ProjectDetailClient({
    project: initialProject,
    initialSelectedModels,
    availableModels,
    availableModelsCount,
    availableModelsCurrentPage,
    availableModelsTotalPages,
    initialTalentQuery,
    activityLogs = [],
}: ProjectDetailClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [project, setProject] = useState(initialProject);
    const [selectedModels, setSelectedModels] = useState(initialSelectedModels);
    const [searchQuery, setSearchQuery] = useState(initialTalentQuery);
    const lastSearchedQueryRef = useRef(initialTalentQuery);
    const [isPending, startTransition] = useTransition();
    const [isEditing, setIsEditing] = useState(false);
    const [scheduleOpen, setScheduleOpen] = useState(false);
    const [activityOpen, setActivityOpen] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Obtener visualizaciones únicas de modelos ("Vistos" estilo Stories)
    const uniqueViewers = useMemo(() => {
        const openedLinkLogs = (activityLogs || []).filter(
            (log: any) => log.category === 'talent' && log.metadata?.action === 'opened_link'
        );

        const uniqueViewersMap = new Map<string, { id: string; name: string; date: Date; gender?: string }>();
        openedLinkLogs.forEach((log: any) => {
            const entityId = log.metadata?.entity_id;
            if (!entityId) return;

            let modelName = log.metadata?.model_alias;
            if (!modelName) {
                // Fallback: parsear desde el título
                const title = log.title || '';
                const match = title.match(/^(.*?) abrió el enlace/);
                if (match && match[1]) {
                    modelName = match[1];
                } else {
                    modelName = 'modelo';
                }
            }

            const logDate = new Date(log.created_at);
            const existing = uniqueViewersMap.get(entityId);
            if (!existing || logDate > existing.date) {
                uniqueViewersMap.set(entityId, { 
                    id: entityId, 
                    name: modelName, 
                    date: logDate,
                    gender: log.metadata?.model_gender?.toLowerCase()
                });
            }
        });

        return Array.from(uniqueViewersMap.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [activityLogs]);

    const viewersWithGender = useMemo(() => {
        return uniqueViewers.map(viewer => {
            const model = selectedModels.find(m => m.id === viewer.id);
            return {
                ...viewer,
                gender: viewer.gender || model?.gender?.toLowerCase() || 'female'
            };
        });
    }, [uniqueViewers, selectedModels]);

    const maleViewers = useMemo(() => viewersWithGender.filter(v => v.gender === 'male'), [viewersWithGender]);
    const femaleViewers = useMemo(() => viewersWithGender.filter(v => v.gender !== 'male'), [viewersWithGender]);

    // Retornar los logs de actividad completos deduplicados
    const filteredActivityLogs = useMemo(() => {
        if (!activityLogs) return [];
        const seenOpened = new Set<string>();
        const seenApplied = new Set<string>();
        const seenDeclined = new Set<string>();

        return activityLogs.filter((log: any) => {
            const action = log.metadata?.action;
            const entityId = log.metadata?.entity_id;

            if (action === 'opened_link' && entityId) {
                if (seenOpened.has(entityId)) return false;
                seenOpened.add(entityId);
            }
            if (action === 'applied' && entityId) {
                if (seenApplied.has(entityId)) return false;
                seenApplied.add(entityId);
            }
            if (action === 'declined' && entityId) {
                if (seenDeclined.has(entityId)) return false;
                seenDeclined.add(entityId);
            }
            return true;
        });
    }, [activityLogs]);

    // Sincronizar estado cuando los props cambian (después de router.refresh())
    useEffect(() => {
        setProject(initialProject);
        setSelectedModels(initialSelectedModels);
    }, [initialProject, initialSelectedModels]);

    useEffect(() => {
        if (initialTalentQuery !== lastSearchedQueryRef.current) {
            setSearchQuery(initialTalentQuery);
            lastSearchedQueryRef.current = initialTalentQuery;
        }
    }, [initialTalentQuery]);

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


    const visibleAvailableModels = useMemo(() => {
        const selectedIds = new Set(selectedModels.map(m => m.id));
        return availableModels.filter(model => !selectedIds.has(model.id));
    }, [availableModels, selectedModels]);

    const updateTalentPickerParams = React.useCallback((next: { query?: string; page?: number }) => {
        const params = new URLSearchParams(searchParams.toString());

        if (next.query !== undefined) {
            if (next.query.trim()) params.set('talentQ', next.query.trim());
            else params.delete('talentQ');
        }

        if (next.page !== undefined) {
            if (next.page <= 1) params.delete('talentPage');
            else params.set('talentPage', String(next.page));
        }

        startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        });
    }, [pathname, router, searchParams]);

    const handleTalentSearch = useDebouncedCallback((value: string) => {
        lastSearchedQueryRef.current = value;
        updateTalentPickerParams({ query: value, page: 1 });
    }, 300);

    const handleAddModel = (modelId: string) => {
        startTransition(async () => {
            // Optimistic update ANTES de la llamada al servidor
            const modelToAdd = availableModels.find(m => m.id === modelId);
            if (modelToAdd) {
                setSelectedModels(prev => [...prev, {
                    ...(modelToAdd as unknown as Model),
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

                </div>
            </header>

            <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-stretch">
                {/* Columna izquierda: Datos del proyecto */}
                <div className="space-y-6">
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
                </div>

                {/* Columna derecha: Enlaces y Accesos */}
                <ProjectLinksCard project={project} onStatusChange={handleStatusChange} />
            </div>

            <div className="grid md:grid-cols-[30%_1fr] gap-6 items-start">
                <Card className="flex flex-col h-full">
                    <CardHeader>
                        <CardTitle>Selección de Talentos</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4 flex-1 flex flex-col min-h-0">
                        <SearchBar
                            value={searchQuery}
                            onValueChange={(val) => {
                                setSearchQuery(val);
                                handleTalentSearch(val);
                            }}
                            onClear={() => {
                                setSearchQuery('');
                                lastSearchedQueryRef.current = '';
                                updateTalentPickerParams({ query: '', page: 1 });
                            }}
                            onSubmit={(value) => {
                                lastSearchedQueryRef.current = value;
                                updateTalentPickerParams({ query: value, page: 1 });
                            }}
                            placeholder="Buscar talento por nombre o alias..."
                            ariaLabel="Buscar talento"
                            inputClassName="h-9"
                        />
                        <Separator />
                        <ScrollArea className="h-125">
                            <div className="space-y-2 pr-4">
                                {visibleAvailableModels.length > 0 ? visibleAvailableModels.map(model => (
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

                        {availableModelsTotalPages > 1 && (
                            <div className="pt-2 border-t">
                                <Pagination>
                                    <PaginationContent className="flex justify-between w-full">
                                        <PaginationItem>
                                            <PaginationPrevious
                                                href="#"
                                                className={availableModelsCurrentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                                                onClick={(event) => {
                                                    event.preventDefault();
                                                    if (availableModelsCurrentPage > 1) {
                                                        updateTalentPickerParams({ page: availableModelsCurrentPage - 1 });
                                                    }
                                                }}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                                <span>Anterior</span>
                                            </PaginationPrevious>
                                        </PaginationItem>

                                        <div className="text-body text-muted-foreground whitespace-nowrap self-center px-2">
                                            Página {availableModelsCurrentPage} de {availableModelsTotalPages}
                                            <span className="hidden sm:inline"> · {availableModelsCount} talentos</span>
                                        </div>

                                        <PaginationItem>
                                            <PaginationNext
                                                href="#"
                                                className={availableModelsCurrentPage >= availableModelsTotalPages ? 'pointer-events-none opacity-50' : ''}
                                                onClick={(event) => {
                                                    event.preventDefault();
                                                    if (availableModelsCurrentPage < availableModelsTotalPages) {
                                                        updateTalentPickerParams({ page: availableModelsCurrentPage + 1 });
                                                    }
                                                }}
                                            >
                                                <span>Siguiente</span>
                                                <ChevronRight className="h-4 w-4" />
                                            </PaginationNext>
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        )}
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

             {/* Sección de Historial y Vistos en Grid de dos columnas */}
            <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6 items-start">
                {/* Panel de "vistos" (quienes abrieron el enlace) - Siempre visible */}
                <Card className="h-full">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-title font-semibold flex items-center gap-2">
                            <Eye className="h-5 w-5 text-muted-foreground" />
                            Vistos ({uniqueViewers.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Mujeres */}
                        <div>
                            <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                                Mujeres ({femaleViewers.length})
                            </span>
                            {femaleViewers.length > 0 ? (
                                <ol className="space-y-2 text-label pl-0 list-none">
                                    {femaleViewers.map((viewer, index) => {
                                        const formattedTime = viewer.date.toLocaleString('es-GT', {
                                            timeZone: 'America/Guatemala',
                                            day: 'numeric',
                                            month: 'short',
                                            hour: 'numeric',
                                            minute: '2-digit',
                                            hour12: true,
                                        });
                                        return (
                                            <li key={viewer.id} className="flex justify-between items-center gap-2 text-foreground/90 border-b border-separator/10 pb-1.5 last:border-0 last:pb-0">
                                                <span className="truncate font-medium">
                                                    {index + 1}. {viewer.name}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                    {isMounted ? formattedTime : ''}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ol>
                            ) : (
                                <p className="text-label text-muted-foreground py-1">
                                    Ninguna mujer ha visto el proyecto aún.
                                </p>
                            )}
                        </div>

                        {/* Hombres */}
                        <div className="pt-3 border-t border-separator/30">
                            <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                                Hombres ({maleViewers.length})
                            </span>
                            {maleViewers.length > 0 ? (
                                <ol className="space-y-2 text-label pl-0 list-none">
                                    {maleViewers.map((viewer, index) => {
                                        const formattedTime = viewer.date.toLocaleString('es-GT', {
                                            timeZone: 'America/Guatemala',
                                            day: 'numeric',
                                            month: 'short',
                                            hour: 'numeric',
                                            minute: '2-digit',
                                            hour12: true,
                                        });
                                        return (
                                            <li key={viewer.id} className="flex justify-between items-center gap-2 text-foreground/90 border-b border-separator/10 pb-1.5 last:border-0 last:pb-0">
                                                <span className="truncate font-medium">
                                                    {index + 1}. {viewer.name}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                    {isMounted ? formattedTime : ''}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ol>
                            ) : (
                                <p className="text-label text-muted-foreground py-1">
                                    Ningún hombre ha visto el proyecto aún.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Historial de Actividad del Proyecto */}
                <Card className="h-full">
                    <Collapsible open={activityOpen} onOpenChange={setActivityOpen}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                            <div>
                                <CardTitle className="text-title font-semibold flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    Historial de Actividad del Proyecto
                                </CardTitle>
                            </div>
                            <CollapsibleTrigger asChild>
                                <button
                                    type="button"
                                    className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-transparent border border-separator hover:bg-hover-overlay transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                                    aria-label={activityOpen ? 'contraer actividad' : 'expandir actividad'}
                                >
                                    <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${activityOpen ? 'rotate-180' : ''}`} />
                                </button>
                            </CollapsibleTrigger>
                        </CardHeader>
                        <CollapsibleContent asChild>
                            <CardContent className="space-y-4">
                                {filteredActivityLogs && filteredActivityLogs.length > 0 ? (
                                    <div className="divide-y divide-separator/10">
                                        {filteredActivityLogs.map((log: any) => {
                                            const date = new Date(log.created_at);
                                            const formattedTime = date.toLocaleString('es-GT', {
                                                timeZone: 'America/Guatemala',
                                                day: 'numeric',
                                                month: 'short',
                                                hour: 'numeric',
                                                minute: '2-digit',
                                                hour12: true,
                                            });

                                            return (
                                                <div key={log.id} className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                    <div>
                                                        <p className="text-body font-medium text-foreground">
                                                            {renderFormattedActivity(log.title, project.client_name, selectedModels, availableModels)}
                                                        </p>
                                                    </div>
                                                    <span className="text-label text-muted-foreground whitespace-nowrap shrink-0">
                                                        {isMounted ? formattedTime : ''}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-center text-body text-muted-foreground py-4">
                                        No hay registros de actividad para este proyecto.
                                    </p>
                                )}
                            </CardContent>
                        </CollapsibleContent>
                    </Collapsible>
                </Card>
            </div>

            <DangerZone project={project} />
        </div>
    );
}