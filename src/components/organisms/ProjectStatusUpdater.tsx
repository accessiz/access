'use client'

import { Project, Model } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Send, Archive, ListChecks, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Configuration for status labels and icons (no changes here)
const statusConfig = {
  draft: { label: 'Borrador', icon: <ListChecks className="mr-2 h-4 w-4" /> },
  sent: { label: 'Enviado', icon: <Send className="mr-2 h-4 w-4" /> },
  'in-review': { label: 'En Revisión', icon: <Clock className="mr-2 h-4 w-4" /> },
  completed: { label: 'Completado', icon: <CheckCircle2 className="mr-2 h-4 w-4" /> },
  archived: { label: 'Archivado', icon: <Archive className="mr-2 h-4 w-4" /> },
};

// Configuration for status badge styles (no changes here)
const statusStyles: { [key: string]: string } = {
    draft: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    sent: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'in-review': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    completed: 'bg-green-500/20 text-green-400 border-green-500/30',
    archived: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

interface ProjectStatusUpdaterProps {
  project: Project;
  selectedModels: Model[];
}

export function ProjectStatusUpdater({ project, selectedModels }: ProjectStatusUpdaterProps) {
  const reviewedCount = selectedModels.filter(m => m.client_selection !== 'pending').length;
  const totalCount = selectedModels.length;
  const progress = totalCount > 0 ? (reviewedCount / totalCount) * 100 : 0;

  return (
    <Card>
        {/* --- CardHeader updated for responsiveness --- */}
        {/* Mobile: flex-col, items-start. Desktop: sm:flex-row, sm:items-center, sm:justify-between */}
      <CardHeader className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Estado y Progreso</CardTitle>
          <CardDescription>Monitoriza la revisión del cliente y el ciclo de vida del proyecto.</CardDescription>
        </div>
        {/* Badge takes full width on mobile for better visibility */}
        <Badge variant="outline" className={`capitalize text-base px-3 py-1 w-full justify-center sm:w-auto ${statusStyles[project.status] || ''}`}>
          {statusConfig[project.status]?.icon}
          {statusConfig[project.status]?.label || 'Estado'}
        </Badge>
      </CardHeader>
      {/* --- END CardHeader update --- */}
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Revisión del Cliente</span>
            <span>{reviewedCount} de {totalCount} talentos revisados</span>
          </div>
          <Progress value={progress} />
        </div>
      </CardContent>
    </Card>
  );
}