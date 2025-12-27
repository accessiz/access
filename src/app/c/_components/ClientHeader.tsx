'use client';

import { Project } from '@/lib/types';

interface ClientHeaderProps {
  project: Project;
}

// Helper para convertir hora 12h a minutos totales para ordenamiento
const timeToMinutes = (timeStr: string) => {
  const parts = timeStr.split(' ');
  if (parts.length < 2) return 0; // Fallback para formatos inesperados

  const [time, period] = parts;
  const [hoursStr, minutesStr] = time.split(':');
  let hours = Number(hoursStr);
  const minutes = Number(minutesStr);

  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

// Helper para formatear fechas y horarios
const formatSchedule = (schedule: Project['schedule']) => {
  if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
    return null;
  }

  // Agrupar horarios por fecha
  const groupedByDate: Record<string, { startTime: string; endTime: string }[]> = {};
  schedule.forEach(item => {
    if (item && item.date && item.startTime && item.endTime) {
      if (!groupedByDate[item.date]) {
        groupedByDate[item.date] = [];
      }
      groupedByDate[item.date].push({ startTime: item.startTime, endTime: item.endTime });
    }
  });

  // Ordenar fechas cronológicamente
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  // Formatear la salida
  return sortedDates.map(dateStr => {
    const horarios = groupedByDate[dateStr]
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
      .map(h => `${h.startTime} - ${h.endTime}`)
      .join(' | ');


    const dateObj = new Date(`${dateStr}T00:00:00`); // Asegurar que se interprete en la zona horaria local
    const formattedDate = dateObj.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return (
      <div key={dateStr} className="flex flex-col md:flex-row md:items-baseline md:gap-4">
        <span className="font-semibold capitalize min-w-[240px]">{formattedDate}:</span>
        <span className="font-mono">{horarios}</span>
      </div>
    );
  });
};

export function ClientHeader({ project }: ClientHeaderProps) {
  const scheduleElements = formatSchedule(project.schedule);

  return (
    <header className="px-0 text-left space-y-6">
      <div>
        <p className="text-label-12 uppercase tracking-widest text-muted-foreground">
          PROYECTO
        </p>
        <h1 className="mt-1 text-heading-40 sm:text-heading-48 md:text-heading-72 uppercase">
          {project.project_name || 'Selección de Talento'}
        </h1>
      </div>

      {scheduleElements && (
        <div className="space-y-2 text-copy-14 text-foreground/80">
          <h2 className="text-label-14 uppercase tracking-widest text-muted-foreground">Fechas del Casting</h2>
          <div className="flex flex-col gap-1">{scheduleElements}</div>
        </div>
      )}
    </header>
  );
}
