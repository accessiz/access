'use client'

import { useOptimistic, useTransition } from 'react';
import { toast } from 'sonner';
import { Project, Model, ProjectStatus } from '@/lib/types';
import { updateProjectStatus } from '@/lib/actions/projects';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { CheckCircle2, Send, Archive, ListChecks, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusConfig: Record<ProjectStatus, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
  draft: {
    label: 'Borrador',
    icon: <ListChecks className="mr-2 h-4 w-4" />,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10 border-yellow-500/20'
  },
  sent: {
    label: 'Enviado',
    icon: <Send className="mr-2 h-4 w-4" />,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10 border-blue-500/20'
  },
  'in-review': {
    label: 'En Revisión',
    icon: <Clock className="mr-2 h-4 w-4" />,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10 border-purple-500/20'
  },
  completed: {
    label: 'Completado',
    icon: <CheckCircle2 className="mr-2 h-4 w-4" />,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10 border-green-500/20'
  },
  archived: {
    label: 'Archivado',
    icon: <Archive className="mr-2 h-4 w-4" />,
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10 border-gray-500/20'
  },
};

const statusKeys = Object.keys(statusConfig) as ProjectStatus[];

interface ProjectStatusUpdaterProps {
  project: Project;
  selectedModels: Model[];
}

export function ProjectStatusUpdater({ project, selectedModels }: ProjectStatusUpdaterProps) {
  const [isPending, startTransition] = useTransition();

  // UI Optimista
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(
    project.status,
    (state, newStatus: ProjectStatus) => newStatus
  );

  const reviewedCount = selectedModels.filter(m => m.client_selection !== 'pending').length;
  const totalCount = selectedModels.length;
  const progress = totalCount > 0 ? (reviewedCount / totalCount) * 100 : 0;

  const currentConfig = statusConfig[optimisticStatus];

  const handleStatusChange = (newStatus: ProjectStatus) => {
    startTransition(async () => {
      setOptimisticStatus(newStatus);
      const result = await updateProjectStatus(project.id, newStatus);

      if (result.success) {
        toast.success(`Proyecto actualizado a: ${statusConfig[newStatus].label}`);
      } else {
        toast.error('Error al actualizar', { description: result.error });
      }
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Estado y Progreso</CardTitle>
        </div>


        <Select
          value={optimisticStatus}
          onValueChange={(value: ProjectStatus) => handleStatusChange(value)}
          disabled={isPending}
        >
          <SelectTrigger
            className={cn(
              "w-full sm:w-[200px] transition-colors duration-300 font-medium border-2",
              currentConfig.bgColor,
              currentConfig.color
            )}
            id="project-status"
          >
            <div className="flex items-center gap-2">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : currentConfig.icon}
              <span>{currentConfig.label}</span>
            </div>
          </SelectTrigger>

          <SelectContent>
            {statusKeys.map((statusKey) => (
              <SelectItem
                key={statusKey}
                value={statusKey}
                // --- CORRECCIÓN AQUÍ ---
                // Usamos [&>span.absolute]:hidden para ocultar SOLO el span del cheque (que tiene position: absolute)
                // y NO ocultar el span del texto.
                className="pl-2 [&>span.absolute]:hidden cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {statusConfig[statusKey].icon}
                  <span>{statusConfig[statusKey].label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-copy-14 text-muted-foreground">
            <span>Revisión del Cliente</span>
            <span>{reviewedCount} de {totalCount} talentos revisados</span>
          </div>
          <Progress value={progress} />
        </div>
      </CardContent>
    </Card>
  );
}