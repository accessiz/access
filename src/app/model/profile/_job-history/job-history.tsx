'use client';

import * as React from 'react';
import Link from 'next/link';
import { Calendar, MapPin, DollarSign, X, Check } from 'lucide-react';
import { useJobHistory } from './job-history.logic';
import { JobHistoryProps } from './job-history.types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { YearSelect } from '@/components/molecules/YearSelect';
import { MonthSelect } from '@/components/molecules/MonthSelect';
import './job-history.styles.css';


const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const formatScheduleDate = (dateStr: string) => {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return { fullDate: dateStr, dayNumber: 0, month: '' };
  const [year, month, day] = parts;
  
  const date = new Date(`${dateStr}T00:00:00`);
  const dayOfWeek = date.getDay();
  const dayNumber = date.getDate();
  const monthIndex = date.getMonth();

  const fullDate = `${WEEKDAYS[dayOfWeek]}, ${dayNumber} de ${MONTHS[monthIndex]}`;
  return {
    dayNumber,
    month: MONTHS[monthIndex],
    fullDate,
  };
};

export function JobHistory({ projects, className }: JobHistoryProps) {
  const {
    selectedProject,
    setSelectedProject,
    stateFilter,
    setStateFilter,
    yearFilter,
    setYearFilter,
    monthFilter,
    setMonthFilter,
    yearOptions,
    filteredProjects,
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedProjects,
  } = useJobHistory(projects);


  // Close modal on escape keypress
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedProject(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSelectedProject]);

  return (
    <div className={`bg-[rgb(var(--ds-color-surface-container))] border border-[rgb(var(--ds-color-outline-variant))]/20 rounded-3xl p-6 shadow-sm text-left ${className || ''}`}>
      
      {/* Header */}
      <div className="border-b border-[rgb(var(--ds-color-outline-variant))]/20 pb-5 mb-5 text-left">
        <div>
          <h3 className="ds-text-lg font-extrabold text-foreground">Tus Trabajos y Pagos</h3>
          <p className="ds-text-xs text-muted-foreground mt-0.5">Aquí aparecen tus proyectos aprobados, pendientes de realizar y cobros registrados.</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-2 gap-4 mb-6 bg-[rgb(var(--ds-color-surface-container-lowest))] p-4 rounded-2xl border border-[rgb(var(--ds-color-outline-variant))]/20">
        
        {/* Estado de Trabajo */}
        <div className="flex flex-col gap-1.5 text-left col-span-2">
          <label className="ds-text-xs text-muted-foreground font-bold tracking-wider">Estado de Trabajo</label>
          <Select value={stateFilter} onValueChange={(v) => setStateFilter(v as any)}>
            <SelectTrigger className="!h-10 rounded-xl bg-[rgb(var(--ds-color-surface-container))] border-[rgb(var(--ds-color-outline-variant))]/20 text-xs">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Trabajos</SelectItem>
              <SelectItem value="pending">Pendientes (Por realizar)</SelectItem>
              <SelectItem value="unpaid">Por Cobrar</SelectItem>
              <SelectItem value="paid">Pagados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Año */}
        <div className="flex flex-col gap-1.5 text-left col-span-1">
          <label className="ds-text-xs text-muted-foreground font-bold tracking-wider">Año</label>
          <YearSelect
            years={yearOptions}
            onValueChange={setYearFilter}
            value={yearFilter}
            triggerClassName="!h-10 rounded-xl bg-[rgb(var(--ds-color-surface-container))] border-[rgb(var(--ds-color-outline-variant))]/20 text-xs"
          />
        </div>

        {/* Mes */}
        <div className="flex flex-col gap-1.5 text-left col-span-1">
          <label className="ds-text-xs text-muted-foreground font-bold tracking-wider">Mes</label>
          <MonthSelect
            onValueChange={setMonthFilter}
            value={monthFilter}
            triggerClassName="!h-10 rounded-xl bg-[rgb(var(--ds-color-surface-container))] border-[rgb(var(--ds-color-outline-variant))]/20 text-xs"
          />
        </div>

      </div>

        {/* Listado de Proyectos */}
        <div className="min-h-[220px]">
          {filteredProjects.length > 0 ? (
            <>
              {/* Mobile View: Stacked cards */}
              <div className="space-y-3 md:hidden">
                {paginatedProjects.map((project) => {
                  // Consolidated date (numeric)
                  let datesStr = 'No definido';
                  if (project.schedule && project.schedule.length > 0) {
                    const sorted = [...project.schedule].sort((a, b) => a.date.localeCompare(b.date));
                    const start = formatScheduleDate(sorted[0].date);
                    if (sorted.length === 1) {
                      datesStr = start.fullDate;
                    } else {
                      const startParts = sorted[0].date.split('-');
                      const endParts = sorted[sorted.length - 1].date.split('-');
                      datesStr = `${startParts[2]}/${startParts[1]} – ${endParts[2]}/${endParts[1]}/${startParts[0]}`;
                    }
                  }

                  // Fee string
                  const fee = project.agreed_fee;
                  const currency = (project.currency || 'GTQ').toUpperCase();
                  const feeStr = fee ? `${currency} ${fee.toLocaleString()}` : 'Canje';

                  // Calculate work state
                  let isProjectFinished = false;
                  if (project.schedule && project.schedule.length > 0) {
                    const sorted = [...project.schedule].sort((a, b) => a.date.localeCompare(b.date));
                    const lastSchedule = sorted[sorted.length - 1];
                    const lastDate = new Date(`${lastSchedule.date}T23:59:59`);
                    isProjectFinished = lastDate < new Date();
                  }

                  let statusBadge = null;
                  if (project.isPaid) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full">
                        <Check className="h-2.5 w-2.5 stroke-[3]" /> Pagado
                      </span>
                    );
                  } else if (isProjectFinished) {
                    statusBadge = (
                      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full">
                        Por Cobrar
                      </span>
                    );
                  } else {
                    statusBadge = (
                      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-full">
                        Pendiente
                      </span>
                    );
                  }

                  return (
                    <div
                      key={project.project_id}
                      onClick={() => setSelectedProject(project)}
                      className="flex items-center justify-between p-4 bg-tertiary/40 border border-border/40 rounded-xl hover:bg-tertiary/60 transition-all cursor-pointer text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                          {datesStr}
                        </span>
                        <h4 className="text-body font-bold text-foreground truncate mt-1">
                          {project.project_name}
                        </h4>
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {statusBadge}
                      </div>
                    </div>
                      <div className="text-right shrink-0 ml-3">
                        <span className="block text-[8px] font-extrabold text-muted-foreground tracking-widest">
                          Pago
                        </span>
                        <span className="block text-xs font-extrabold text-foreground mt-0.5">
                          {feeStr}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop View: Sortable Table */}
              <div className="hidden md:block">
                <div className="border border-border/40 rounded-2xl overflow-hidden bg-card">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow className="bg-tertiary/40 hover:bg-tertiary/40 border-b border-border/40">
                        <TableHead className="w-12 font-bold text-muted-foreground tracking-wider text-[10px] text-left pl-4 py-3">#</TableHead>
                        <TableHead className="font-bold text-muted-foreground tracking-wider text-[10px] text-left py-3">Proyecto</TableHead>
                        <TableHead className="font-bold text-muted-foreground tracking-wider text-[10px] text-left py-3">Estado</TableHead>
                        <TableHead className="font-bold text-muted-foreground tracking-wider text-[10px] text-left py-3">Pago</TableHead>
                        <TableHead className="font-bold text-muted-foreground tracking-wider text-[10px] text-left pr-4 py-3">Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedProjects.map((project, index) => {
                        const rowNumber = ((currentPage - 1) * 16) + index + 1;
                        
                        // Consolidated date (numeric)
                        let datesStr = 'No definido';
                        if (project.schedule && project.schedule.length > 0) {
                          const sorted = [...project.schedule].sort((a, b) => a.date.localeCompare(b.date));
                          const start = formatScheduleDate(sorted[0].date);
                          if (sorted.length === 1) {
                            datesStr = start.fullDate;
                          } else {
                            const startParts = sorted[0].date.split('-');
                            const endParts = sorted[sorted.length - 1].date.split('-');
                            datesStr = `${startParts[2]}/${startParts[1]} – ${endParts[2]}/${endParts[1]}/${startParts[0]}`;
                          }
                        }

                        // Fee string
                        const fee = project.agreed_fee;
                        const currency = (project.currency || 'GTQ').toUpperCase();
                        const feeStr = fee ? `${currency} ${fee.toLocaleString()}` : 'Canje';

                        // Selection state
                        const isApproved = project.client_selection === 'approved';
                        const isRejected = project.client_selection === 'rejected';

                        return (
                          <TableRow 
                            key={project.project_id} 
                            onClick={() => setSelectedProject(project)}
                            className="hover:bg-tertiary/30 border-b border-border/40 transition-colors cursor-pointer"
                          >
                            <TableCell className="text-muted-foreground font-mono text-xs pl-4 py-3.5">
                              {rowNumber.toString().padStart(2, '0')}
                            </TableCell>
                            <TableCell className="font-semibold text-foreground py-3.5 max-w-[220px] truncate">
                              {project.project_name}
                            </TableCell>
                            <TableCell className="py-3.5">
                              <div className="flex flex-wrap items-center gap-1">
                                {(() => {
                                  let isProjectFinished = false;
                                  if (project.schedule && project.schedule.length > 0) {
                                    const sorted = [...project.schedule].sort((a, b) => a.date.localeCompare(b.date));
                                    const lastSchedule = sorted[sorted.length - 1];
                                    const lastDate = new Date(`${lastSchedule.date}T23:59:59`);
                                    isProjectFinished = lastDate < new Date();
                                  }

                                  if (project.isPaid) {
                                    return (
                                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full">
                                        <Check className="h-2.5 w-2.5 stroke-[3]" /> Pagado
                                      </span>
                                    );
                                  } else if (isProjectFinished) {
                                    return (
                                      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full">
                                        Por Cobrar
                                      </span>
                                    );
                                  } else {
                                    return (
                                      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-full">
                                        Pendiente
                                      </span>
                                    );
                                  }
                                })()}
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold text-foreground py-3.5">
                              {feeStr}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs pr-4 py-3.5">
                              {datesStr}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 rounded-2xl bg-tertiary/20 border border-dashed border-border/60">
              <Calendar className="h-8 w-8 text-muted-foreground/50 mb-3" />
              <h4 className="text-foreground font-extrabold text-xs">No se encontraron proyectos</h4>
              <p className="text-[11px] text-muted-foreground text-center max-w-xs mt-1 leading-relaxed">
                Prueba ajustando los filtros de estado o período de tiempo.
              </p>
            </div>
          )}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border/40 pt-4 mt-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Página {currentPage} de {totalPages} ({filteredProjects.length} proyectos)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="px-3 py-1.5 text-[10px] font-bold rounded-lg border border-border bg-card text-foreground hover:bg-hover-overlay/5 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed uppercase"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className="px-3 py-1.5 text-[10px] font-bold rounded-lg border border-border bg-card text-foreground hover:bg-hover-overlay/5 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed uppercase"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}




      {/* Detail Modal */}
      {selectedProject && (() => {
        const isExpired = selectedProject.apply_end_at ? new Date() > new Date(selectedProject.apply_end_at) : false;
        
        let isProjectFinished = false;
        if (selectedProject.schedule && selectedProject.schedule.length > 0) {
          const sorted = [...selectedProject.schedule].sort((a, b) => a.date.localeCompare(b.date));
          const lastSchedule = sorted[sorted.length - 1];
          const lastDate = new Date(`${lastSchedule.date}T23:59:59`);
          isProjectFinished = lastDate < new Date();
        }

        return (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setSelectedProject(null)}>
            <div className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-start gap-4 border-b border-border/40 pb-4">
                <div className="space-y-1 text-left">
                <h3 className="text-title font-bold text-foreground">{selectedProject.project_name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="h-11 w-11 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-all duration-200 border-0 cursor-pointer shadow-lg active:scale-95 shrink-0"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 text-left">
              {/* Badges */}
              <div className="flex items-center gap-2">
                {selectedProject.isPaid ? (
                  <span className="flex items-center gap-1 text-label bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-2.5 py-1 rounded-full font-semibold">
                    <Check className="h-3 w-3 stroke-[3]" /> Pagado
                  </span>
                ) : isProjectFinished ? (
                  <span className="flex items-center gap-1 text-label bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2.5 py-1 rounded-full font-semibold">
                    Por Cobrar
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-label bg-blue-500/10 border border-blue-500/20 text-blue-500 px-2.5 py-1 rounded-full font-semibold">
                    Pendiente
                  </span>
                )}
              </div>

              {/* Location and Description */}
              <div className="grid gap-4 p-5 rounded-2xl bg-tertiary/40 border border-border/40">
                {selectedProject.location && (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                    <div>
                      <span className="text-label text-muted-foreground block font-bold tracking-wide">Lugar</span>
                      <span className="text-body font-semibold text-foreground">{selectedProject.location}</span>
                    </div>
                  </div>
                )}

                {selectedProject.description && (
                  <div className="flex items-start gap-2.5">
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                    <div>
                      <span className="text-label text-muted-foreground block font-bold tracking-wide">Descripción del Trabajo</span>
                      <span className="text-body font-semibold text-foreground">{selectedProject.description}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2.5">
                  <DollarSign className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                  <div>
                    <span className="text-label text-muted-foreground block font-bold tracking-wide">Pago</span>
                    <span className="text-body font-semibold text-foreground">
                      {selectedProject.agreed_fee
                        ? `${(selectedProject.currency || 'GTQ').toUpperCase()} ${selectedProject.agreed_fee.toLocaleString()} ${selectedProject.fee_type === 'per_hour' ? 'Por Hora' : selectedProject.fee_type === 'fixed' ? 'Monto Fijo' : 'Por Día'}`
                        : 'Canje'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Schedules List */}
              {selectedProject.schedule && selectedProject.schedule.length > 0 && (
                <div className="space-y-3">
                  <span className="text-label font-bold tracking-wide text-muted-foreground block mb-1">
                    Horarios del Proyecto
                  </span>
                  <div className="divide-y divide-border/40 border border-border/40 rounded-xl bg-background overflow-hidden">
                    {selectedProject.schedule.map((sch) => {
                      const { fullDate } = formatScheduleDate(sch.date);
                      const isAssigned = selectedProject.assignments.some(
                        (a) => a.schedule_id === sch.id
                      );
                      const assignmentForDay = selectedProject.assignments.find(
                        (a) => a.schedule_id === sch.id
                      );
                      const isDayPaid = assignmentForDay?.payment_status === 'paid';

                      return (
                        <div key={sch.id} className="flex items-center justify-between p-3.5">
                          <div className="flex flex-col">
                             <span className="text-body font-semibold text-foreground">{fullDate}</span>
                             <span className="text-label text-muted-foreground mt-0.5">
                               {selectedProject.hide_schedule ? 'Horario por definir' : `${sch.startTime} - ${sch.endTime}`}
                             </span>
                             {!selectedProject.hide_schedule && sch.location && (
                               <span className="text-label text-muted-foreground mt-0.5">
                                 Lugar: {sch.location}
                               </span>
                             )}
                          </div>

                          <div className="flex items-center gap-2">
                            {selectedProject.client_selection === 'approved' ? (
                              isAssigned ? (
                                <span className="text-label bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded font-medium">
                                  Asignado {isDayPaid && '(Pagado)'}
                                </span>
                              ) : (
                                <span className="text-label bg-tertiary border border-border/40 text-muted-foreground px-2 py-0.5 rounded font-medium">
                                  No Asignado
                                </span>
                              )
                            ) : (
                              <span className="text-label bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2 py-0.5 rounded font-medium">
                                Postulado
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {!isExpired && selectedProject.public_id && (
                <div className="pt-4 border-t border-border/40">
                  <Link
                    href={`/m/${selectedProject.public_id}`}
                    className="bg-purple hover:bg-purple/90 text-white w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm text-xs transition-all text-center block"
                  >
                    Modificar disponibilidad / Cambiar opinión
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    })()}
    </div>
  );
}
