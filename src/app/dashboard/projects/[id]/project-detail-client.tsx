'use client'

import { useState, useTransition, useMemo } from 'react';
import { toast } from 'sonner';
import { Model, Project } from '@/lib/types';
import { addModelToProject, removeModelFromProject } from '@/lib/actions/projects_models';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, XCircle, Search, Loader2 } from 'lucide-react';
import { DeleteProjectDialog } from '@/components/organisms/DeleteProjectDialog';

// Tipos locales para claridad
type ProjectDetailClientProps = {
  project: Project;
  initialSelectedModels: Model[];
  allModels: Model[];
};

// Componente para una fila de talento en las listas
const TalentRow = ({ model, onAction, isPending, actionType }: {
    model: Model;
    onAction: () => void;
    isPending: boolean;
    actionType: 'add' | 'remove';
}) => (
    <div className="flex items-center gap-4 p-2 hover:bg-muted/50 rounded-md">
        <Avatar className="h-10 w-10">
            <AvatarImage src={model.coverUrl || ''} />
            <AvatarFallback>{model.alias?.substring(0, 2) || 'IZ'}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
            <p className="font-semibold">{model.alias}</p>
            <p className="text-sm text-muted-foreground">{model.country}</p>
        </div>
        <Button size="icon" variant="ghost" onClick={onAction} disabled={isPending} className="h-8 w-8">
            {isPending ? <Loader2 className="animate-spin" /> : (
                actionType === 'add'
                ? <PlusCircle className="text-green-500" />
                : <XCircle className="text-destructive" />
            )}
        </Button>
    </div>
);

// Componente para la Zona de Peligro
const DangerZone = ({ project }: { project: Project }) => (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
        <CardDescription>Estas acciones son permanentes y no se pueden deshacer.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between rounded-lg border border-destructive bg-destructive/5 p-4">
          <div>
            <p className="font-semibold text-foreground">Eliminar este proyecto</p>
            <p className="text-sm text-muted-foreground">Toda la información y selección de talentos se perderá.</p>
          </div>
          <DeleteProjectDialog projectId={project.id} projectName={project.project_name || 'este proyecto'}>
            <Button variant="destructive">Eliminar</Button>
          </DeleteProjectDialog>
        </div>
      </CardContent>
    </Card>
);


export default function ProjectDetailClient({ project, initialSelectedModels, allModels }: ProjectDetailClientProps) {
    const [selectedModels, setSelectedModels] = useState(initialSelectedModels);
    const [searchQuery, setSearchQuery] = useState('');
    const [isPending, startTransition] = useTransition();

    // Filtramos la lista de talentos disponibles para no mostrar los que ya están seleccionados
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
                if (modelToAdd) {
                    setSelectedModels(prev => [...prev, modelToAdd]);
                }
                toast.success(`Talento añadido a ${project.project_name}`);
            } else {
                toast.error(result.error);
            }
        });
    };

    const handleRemoveModel = (modelId: string) => {
        startTransition(async () => {
            const result = await removeModelFromProject(project.id, modelId);
            if (result.success) {
                setSelectedModels(prev => prev.filter(m => m.id !== modelId));
                toast.success(`Talento quitado de ${project.project_name}`);
            } else {
                toast.error(result.error);
            }
        });
    };

    return (
        <div className="p-8 md:p-12 space-y-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight">{project.project_name}</h1>
                <p className="text-muted-foreground">Cliente: {project.client_name || 'No especificado'}</p>
            </header>

            <div className="grid md:grid-cols-2 gap-8 items-start">
                {/* Columna Izquierda: Selección de Talentos */}
                <Card>
                    <CardHeader>
                        <CardTitle>Selección de Talentos</CardTitle>
                        <CardDescription>Busca y añade talentos a este proyecto.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar talento por nombre o alias..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
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
                                    <p className="text-center text-sm text-muted-foreground py-4">No hay más talentos disponibles o que coincidan.</p>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Columna Derecha: Talentos Seleccionados */}
                <Card>
                    <CardHeader>
                        <CardTitle>Talentos en el Proyecto</CardTitle>
                        <CardDescription>
                            Hay {selectedModels.length} talento(s) en esta selección.
                        </CardDescription>
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
                                    <p className="text-center text-sm text-muted-foreground py-4">Aún no has añadido talentos.</p>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            {/* Nueva sección de Danger Zone */}
            <DangerZone project={project} />
        </div>
    );
}