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
    CheckCircle2, XCircle as XCircleIcon, Clock, ChevronLeft, Pencil
} from 'lucide-react';
import { ProjectForm } from '@/components/organisms/ProjectForm';

const ClientStatusBadge = ({ status }: { status: Model['client_selection'] }) => {
  if (status === 'approved') {
    return <Badge variant="outline" className="border-green-500 text-green-500 bg-green-500/10"><CheckCircle2 className="mr-1 h-3 w-3" /> Aprobado</Badge>;
  }
  if (status === 'rejected') {
    return <Badge variant="outline" className="border-red-500 text-red-500 bg-red-500/10"><XCircleIcon className="mr-1 h-3 w-3" /> Rechazado</Badge>;
  }
  return <Badge variant="outline"><Clock className="mr-1 h-3 w-3" /> Pendiente</Badge>;
};

const TalentRow = ({ model, onAction, isPending, actionType }: {
    model: Model;
    onAction: () => void;
    isPending: boolean;
    actionType: 'add' | 'remove';
}) => (
    <div className="flex items-center gap-4 p-2 hover:bg-muted/50 rounded-md">
        <Avatar className="h-9 w-9">
            <AvatarImage src={model.coverUrl || `${SUPABASE_PUBLIC_URL}${model.id}/Portada/cover.jpg`} />
            <AvatarFallback>{model.alias?.substring(0, 2) || 'IZ'}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
            <p className="text-label-14">{model.alias}</p>
            <p className="text-label-13 text-muted-foreground">{model.country}</p>
        </div>
        {actionType === 'remove' && <ClientStatusBadge status={model.client_selection} />}
        <Button size="icon" variant="ghost" onClick={onAction} disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin h-4 w-4" /> : (
                actionType === 'add' ? <PlusCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-destructive" />
            )}
        </Button>
    </div>
);

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

export default function ProjectDetailClient({ project: initialProject, initialSelectedModels, allModels }: ProjectDetailClientProps) {
    const [project, setProject] = useState(initialProject);
    const [selectedModels, setSelectedModels] = useState(initialSelectedModels);
    const [searchQuery, setSearchQuery] = useState('');
    const [isPending, startTransition] = useTransition();
    const [isEditing, setIsEditing] = useState(false);

    const handleStatusChange = (newStatus: Project['status']) => {
        setProject(currentProject => ({ ...currentProject, status: newStatus }));
    };

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
            <header className="flex flex-col items-start gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="flex-shrink-0" asChild>
                        <Link href="/dashboard/projects">
                            <ChevronLeft className="h-4 w-4" />
                            <span className="sr-only">Volver a Proyectos</span>
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-heading-32">{project.project_name}</h1>
                        <p className="text-muted-foreground">Cliente: {project.client_name || 'No especificado'}</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                    <Button variant="outline" asChild className="flex-grow sm:flex-grow-0">
                        <Link href={`/c/${project.id}`} target="_blank"><Eye className="mr-2 h-4 w-4"/> Previsualizar</Link>
                    </Button>
                     <Button onClick={() => setIsEditing(true)} variant="outline" className="flex-grow sm:flex-grow-0">
                        <Pencil className="mr-2 h-4 w-4"/> Editar Proyecto
                    </Button>
                    <ShareProjectDialog project={project} onStatusChange={handleStatusChange}>
                        <Button className="flex-grow sm:flex-grow-0"><Share2 className="mr-2 h-4 w-4"/> Compartir</Button>
                    </ShareProjectDialog>
                </div>
            </header>

            <ProjectStatusUpdater project={project} selectedModels={selectedModels} />

            <div className="grid md:grid-cols-2 gap-8 items-start">
                <Card>
                    <CardHeader>
                        <CardTitle>Selección de Talentos</CardTitle>
                        <CardDescription>Busca y añade talentos a este proyecto.</CardDescription>
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