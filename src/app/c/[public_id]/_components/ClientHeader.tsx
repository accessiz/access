'use client';

import { Project } from '@/lib/types';
import { ScheduleChips } from '@/components/molecules/ScheduleChips';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ClientHeaderProps {
  project: Project;
}

export function ClientHeader({ project }: ClientHeaderProps) {
  return (
    <header className="px-0 text-left space-y-6">
      <Card className="shadow-none">
        <CardHeader className="space-y-2">
          <CardDescription className="text-label uppercase tracking-widest text-muted-foreground">
            Proyecto
          </CardDescription>
          <CardTitle className="text-display uppercase">
            {project.project_name || 'Selección de Talento'}
          </CardTitle>
        </CardHeader>
      </Card>

      {project.schedule && Array.isArray(project.schedule) && project.schedule.length > 0 && (
        <Card className="shadow-none">
          <CardHeader className="space-y-1">
            <CardTitle className="text-title font-semibold">Fechas del proyecto</CardTitle>
          </CardHeader>
          <CardContent>
            <ScheduleChips schedule={project.schedule} />
          </CardContent>
        </Card>
      )}
    </header>
  );
}
