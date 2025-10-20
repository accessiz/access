'use client'

import { useState, useTransition, useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Model, Project } from '@/lib/types';
import { addModelToProject, removeModelFromProject } from '@/lib/actions/projects_models';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Importado
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ShareProjectDialog } from '@/components/organisms/ShareProjectDialog';
import { DeleteProjectDialog } from '@/components/organisms/DeleteProjectDialog';
import { ProjectStatusUpdater } from '@/components/organisms/ProjectStatusUpdater';
import {
    PlusCircle, XCircle, Search, Loader2, Share2, Eye,
    CheckCircle2, XCircle as XCircleIcon, Clock, ChevronLeft
} from 'lucide-react';

// Componente para mostrar la insignia de estado del cliente
const ClientStatusBadge = ({ status }: { status: Model['client_selection'] }) => {
  if (status === 'approved') {
    return <Badge variant="outline" className="border-green-500 text-green-500 bg-green-500/10"><CheckCircle2 className="mr-1 h-3 w-3" /> Aprobado</Badge>;
  }
  if (status === 'rejected') {
    return <Badge variant="outline" className="border-red-500 text-red-500 bg-red-500/10"><XCircleIcon className="mr-1 h-3 w-3" /> Rechazado</Badge>;
  }
  // Por defecto (pending o null)
  return <Badge variant="outline"><Clock className="mr-1 h-3 w-3" /> Pendiente</Badge>;
};

// Componente para mostrar una fila de talento (actualizado para usar publicUrl)
const TalentRow = ({ model, onAction, isPending, actionType, publicUrl }: {
    model: Model;
    onAction: () => void;
    isPending: boolean;
    actionType: 'add' | 'remove';
    publicUrl: string; // Acepta la URL pública
}) => (
    <div className="flex items-center gap-4 p-2 hover:bg-muted/50 rounded-md">
        <Avatar className="h-10 w-10">
            {/* Usa la coverUrl si existe, sino construye la URL pública como fallback */}
            <AvatarImage src={model.coverUrl || `${publicUrl}${model.id}/Portada/cover.jpg`} />
            <AvatarFallback>{model.alias?.substring(0, 2) || 'IZ'}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
            <p className="font-semibold">{model.alias}</p>
            <p className="text-sm text-muted-foreground">{model.country}</p>
        </div>
        {/* Muestra la insignia de estado solo si es una acción de quitar (lista de seleccionados) */}
        {actionType === 'remove' && <ClientStatusBadge status={model.client_selection} />}
        <Button size="icon" variant="ghost" onClick={onAction} disabled={isPending} className="h-8 w-8">
            {/* Muestra un loader si la acción está pendiente */}
            {isPending ? <Loader2 className="animate-spin h-4 w-4" /> : ( // Ajustado tamaño de Loader2
                // Muestra icono de añadir o quitar según el tipo
                actionType === 'add' ? <PlusCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-destructive" /> // Ajustado tamaño de iconos
            )}
        </Button>
    </div>
);

// Componente para la sección "Zona de Peligro" (sin cambios)
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

// Define la interfaz de props para el componente principal
interface ProjectDetailClientProps {
  project: Project;
  initialSelectedModels: Model[];
  allModels: Model[];
  publicStorageUrl: string; // Prop para la URL pública
}

// Componente principal de la página de detalle del proyecto
export default function ProjectDetailClient({ project: initialProject, initialSelectedModels, allModels, publicStorageUrl }: ProjectDetailClientProps) {
    // Estados para manejar el proyecto, los modelos seleccionados, la búsqueda y el estado de carga
    const [project, setProject] = useState(initialProject);
    const [selectedModels, setSelectedModels] = useState(initialSelectedModels);
    const [searchQuery, setSearchQuery] = useState('');
    const [isPending, startTransition] = useTransition(); // Hook para manejar estados de carga de acciones

    // Callback para actualizar el estado local del proyecto cuando cambia en ShareProjectDialog
    const handleStatusChange = (newStatus: Project['status']) => {
        setProject(currentProject => ({ ...currentProject, status: newStatus }));
    };

    // Calcula la lista de modelos disponibles (todos menos los ya seleccionados y filtrados por búsqueda)
    const availableModels = useMemo(() => {
        const selectedIds = new Set(selectedModels.map(m => m.id));
        return allModels
            .filter(model => !selectedIds.has(model.id)) // Excluye los ya seleccionados
            .filter(model => // Filtra por nombre o alias
                model.alias?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                model.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
            );
    }, [allModels, selectedModels, searchQuery]); // Dependencias del cálculo

    // Función para añadir un modelo al proyecto
    const handleAddModel = (modelId: string) => {
        startTransition(async () => { // Usa startTransition para indicar carga
            const result = await addModelToProject(project.id, modelId); // Llama a la Server Action
            if (result.success) {
                // Si tiene éxito, actualiza el estado local añadiendo el modelo
                const modelToAdd = allModels.find(m => m.id === modelId);
                if (modelToAdd) setSelectedModels(prev => [...prev, { ...modelToAdd, client_selection: 'pending' }]); // Añade con estado 'pending'
                toast.success(`Talento añadido a ${project.project_name}`); // Notificación
            } else { toast.error(result.error || "Error desconocido al añadir"); } // Notificación de error
        });
    };

    // Función para quitar un modelo del proyecto
    const handleRemoveModel = (modelId: string) => {
        startTransition(async () => { // Usa startTransition
            const result = await removeModelFromProject(project.id, modelId); // Llama a la Server Action
            if (result.success) {
                // Si tiene éxito, actualiza el estado local quitando el modelo
                setSelectedModels(prev => prev.filter(m => m.id !== modelId));
                toast.success(`Talento quitado de ${project.project_name}`); // Notificación
            } else { toast.error(result.error || "Error desconocido al quitar"); } // Notificación de error
        });
    };

    // Renderizado del componente
    return (
        <div className="p-8 md:p-12 space-y-8">
            {/* Header Responsivo */}
            <header className="flex flex-col items-start gap-4 sm:flex-row sm:items-start sm:justify-between">
                {/* Contenedor Título (con botón volver) */}
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="h-10 w-10 flex-shrink-0" asChild>
                        <Link href="/dashboard/projects">
                            <ChevronLeft className="h-4 w-4" />
                            <span className="sr-only">Volver a Proyectos</span>
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{project.project_name}</h1>
                        <p className="text-muted-foreground">Cliente: {project.client_name || 'No especificado'}</p>
                    </div>
                </div>
                 {/* Contenedor Botones (con flex-wrap) */}
                <div className="flex flex-wrap items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                    {/* Botón Previsualizar */}
                    <Button variant="outline" asChild className="flex-grow sm:flex-grow-0">
                        <Link href={`/c/${project.id}`} target="_blank"><Eye className="mr-2 h-4 w-4"/> Previsualizar</Link>
                    </Button>
                    {/* Botón Compartir */}
                    <ShareProjectDialog project={project} onStatusChange={handleStatusChange}>
                        <Button className="flex-grow sm:flex-grow-0"><Share2 className="mr-2 h-4 w-4"/> Compartir</Button>
                    </ShareProjectDialog>
                </div>
            </header>

            {/* Componente que muestra el estado y progreso del proyecto */}
            <ProjectStatusUpdater project={project} selectedModels={selectedModels} />

            {/* Grid principal con las dos tarjetas */}
            <div className="grid md:grid-cols-2 gap-8 items-start">
                {/* Tarjeta para buscar y añadir talentos */}
                <Card>
                    <CardHeader>
                        <CardTitle>Selección de Talentos</CardTitle>
                        <CardDescription>Busca y añade talentos a este proyecto.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Input de búsqueda */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Buscar talento por nombre o alias..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        </div>
                        <Separator />
                        {/* Lista de talentos disponibles con scroll */}
                        <ScrollArea className="h-96">
                            <div className="space-y-2 pr-4">
                                {availableModels.length > 0 ? availableModels.map(model => (
                                    // Renderiza cada fila de talento disponible, pasando la publicUrl
                                    <TalentRow
                                      key={model.id}
                                      model={model}
                                      onAction={() => handleAddModel(model.id)}
                                      isPending={isPending}
                                      actionType="add"
                                      publicUrl={publicStorageUrl} // Pasar URL pública
                                    />
                                )) : (
                                    // Mensaje si no hay talentos disponibles
                                    <p className="text-center text-sm text-muted-foreground py-4">No hay más talentos disponibles o que coincidan.</p>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Tarjeta para ver y quitar talentos del proyecto */}
                <Card>
                    <CardHeader>
                        <CardTitle>Talentos en el Proyecto</CardTitle>
                        <CardDescription>Hay {selectedModels.length} talento(s) en esta selección.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         {/* Lista de talentos seleccionados con scroll */}
                        <ScrollArea className="h-[28.5rem]">
                            <div className="space-y-2 pr-4">
                                {selectedModels.length > 0 ? selectedModels.map(model => (
                                     // Renderiza cada fila de talento seleccionado, pasando la publicUrl
                                    <TalentRow
                                      key={model.id}
                                      model={model}
                                      onAction={() => handleRemoveModel(model.id)}
                                      isPending={isPending}
                                      actionType="remove"
                                      publicUrl={publicStorageUrl} // Pasar URL pública
                                    />
                                )) : (
                                     // Mensaje si no hay talentos añadidos
                                    <p className="text-center text-sm text-muted-foreground py-4">Aún no has añadido talentos.</p>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            {/* Sección de "Zona de Peligro" */}
            <DangerZone project={project} />
        </div>
    );
}