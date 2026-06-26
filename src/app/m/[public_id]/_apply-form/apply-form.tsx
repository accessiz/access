'use client';

import * as React from 'react';
import Link from 'next/link';
import { Calendar, DollarSign, MapPin, Check, X, ArrowLeft, Info } from 'lucide-react';
import { useApplyForm } from './apply-form.logic';
import { ApplyFormProps } from './apply-form.types';
import { Card, CardContent } from '@/components/ui/card';
import { toTitleCase } from '@/lib/utils';
import { PROJECT_TYPES } from '@/lib/types';
import { timestampToGuatemalaDateTime } from '@/lib/actions/projects/helpers';
import './apply-form.styles.css';

const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const WEEKDAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];
const MONTHS_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

const formatScheduleDate = (dateStr: string) => {
  const date = new Date(`${dateStr}T00:00:00`);
  const dayOfWeek = date.getDay();
  const dayNumber = date.getDate();
  const monthIndex = date.getMonth();

  const dayName = WEEKDAYS_SHORT[dayOfWeek];
  const month = MONTHS_SHORT[monthIndex];
  const fullDate = `${WEEKDAYS[dayOfWeek]}, ${dayNumber} de ${MONTHS[monthIndex]}`;

  return {
    dayName,
    dayNumber,
    month,
    fullDate,
  };
};

export function ApplyForm({ project, model }: ApplyFormProps) {
  const sortedSchedule = React.useMemo(() => {
    if (!project.schedule) return [];
    return [...project.schedule]
      .filter((s) => s.id)
      .sort((a, b) => {
        const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return a.startTime.localeCompare(b.startTime);
      });
  }, [project.schedule]);

  // Default all days to unselected (off) if it's the model's first visit
  const initialSchedules = React.useMemo(() => {
    if (model.model_available_schedules !== null && model.model_available_schedules !== undefined) {
      return model.model_available_schedules;
    }
    return [];
  }, [model.model_available_schedules]);

  const {
    selectedSchedules,
    handleToggleSchedule,
    isPending,
    submitResponse,
  } = useApplyForm(project.id, model.id, initialSchedules);

  const [localStatus, setLocalStatus] = React.useState<string | null>(model.model_status || null);

  React.useEffect(() => {
    setLocalStatus(model.model_status || null);
  }, [model.model_status]);

  // Format dates consolidated string (e.g. "5 al 7 de Jun, 2026")
  const datesConsolidated = React.useMemo(() => {
    if (sortedSchedule.length === 0) return 'No definido';
    if (sortedSchedule.length === 1) {
      return formatScheduleDate(sortedSchedule[0].date).fullDate;
    }
    const start = formatScheduleDate(sortedSchedule[0].date);
    const end = formatScheduleDate(sortedSchedule[sortedSchedule.length - 1].date);
    
    // Get year from first date
    const year = new Date(sortedSchedule[0].date).getFullYear();
    return `${start.dayNumber} al ${end.dayNumber} de ${start.month}, ${year}`;
  }, [sortedSchedule]);

  // Payment string formatting
  const paymentStr = React.useMemo(() => {
    const fee = project.default_model_fee;
    const currency = (project.currency || 'GTQ').toUpperCase();
    if (!fee) return 'Canje';
    const typeLabel = project.default_fee_type === 'per_hour' ? 'Por Hora' : project.default_fee_type === 'fixed' ? 'Monto Fijo' : 'Por Día';
    return `${currency} ${fee.toLocaleString()} ${typeLabel}`;
  }, [project.default_model_fee, project.default_fee_type, project.currency]);


  const isExpired = project.apply_end_at ? new Date() > new Date(project.apply_end_at) : false;
  const applyEnd = project.apply_end_at ? timestampToGuatemalaDateTime(project.apply_end_at) : null;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 relative pb-10 text-left">
      
      {/* Header Volver */}
      <div className="flex items-center gap-4 mb-4">
        <Link
          href="/model/apply"
          className="h-10 w-10 rounded-full bg-card border border-border hover:bg-primary hover:text-background text-foreground flex items-center justify-center transition-colors duration-200 shadow-sm shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Volver a propuestas
        </span>
      </div>

      {/* BOX 1: Información del Proyecto */}
      <Card className="w-full bg-card border border-border rounded-[24px] p-6 md:p-8 shadow-md">
        <CardContent className="p-0 space-y-4">
          <div className="space-y-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple/15 text-purple border border-purple/20 uppercase tracking-wider">
              Propuesta de Trabajo
            </span>
            <h2 className="text-title md:text-display font-extrabold text-foreground tracking-tight leading-tight pt-1">
              {project.project_name}
            </h2>
            {applyEnd && (
              <div className="flex items-center gap-1.5 text-red-500 font-bold text-xs pt-1">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                <span>
                  Límite para aplicar: {applyEnd.date.split('-')[2]} {['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][parseInt(applyEnd.date.split('-')[1], 10) - 1]}, {applyEnd.time}
                </span>
              </div>
            )}
          </div>
          {project.description && (
            <div className="bg-purple/5 border border-purple/15 p-5 rounded-2xl mt-4 flex gap-3 items-start">
              <Info className="h-5 w-5 text-purple shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <span className="block text-[10px] font-extrabold text-purple uppercase tracking-widest">
                  Descripción / Comentarios del Proyecto
                </span>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line font-medium">
                  {project.description}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* BOX 2: Detalles Logísticos */}
      <Card className="w-full bg-card border border-border rounded-[24px] p-6 md:p-8 shadow-md">
        <CardContent className="p-0 space-y-4">
          <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-1">
            Detalles de Logística
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-tertiary/40 border border-border/40 p-4 rounded-xl flex items-start gap-3 text-left">
              <div className="h-8 w-8 rounded-full bg-tertiary flex items-center justify-center text-purple shrink-0">
                <Calendar className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Fechas</span>
                <span className="text-body font-bold text-foreground mt-0.5">{datesConsolidated}</span>
              </div>
            </div>

            <div className="bg-tertiary/40 border border-border/40 p-4 rounded-xl flex items-start gap-3 text-left">
              <div className="h-8 w-8 rounded-full bg-tertiary flex items-center justify-center text-emerald-500 shrink-0">
                <DollarSign className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Pago Estimado</span>
                <span className="text-body font-bold text-foreground mt-0.5">{paymentStr}</span>
              </div>
            </div>

            <div className="bg-tertiary/40 border border-border/40 p-4 rounded-xl flex items-start gap-3 text-left sm:col-span-2">
              <div className="h-8 w-8 rounded-full bg-tertiary flex items-center justify-center text-purple shrink-0">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Ubicación</span>
                <span className="text-body font-bold text-foreground mt-0.5 truncate">{project.location || 'Guatemala'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BOX 3: Disponibilidad y Confirmación */}
      <Card className="w-full bg-card border border-border rounded-[24px] p-6 md:p-8 shadow-md">
        <CardContent className="p-0 space-y-6">
          {/* Banner de Expiración */}
          {isExpired && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-medium p-4 rounded-xl flex items-start gap-3 text-left">
              <X className="h-5 w-5 shrink-0 mt-0.5 text-rose-500" />
              <div>
                <span className="block font-bold">Esta propuesta ha expirado</span>
                {applyEnd && (
                  <span className="block text-xs opacity-80 mt-0.5">
                    El plazo para confirmar tu disponibilidad venció el {applyEnd.date.split('-')[2]} de {MONTHS[parseInt(applyEnd.date.split('-')[1], 10) - 1].toLowerCase()} a las {applyEnd.time}.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Selector de Días */}
          {!isExpired && sortedSchedule.length > 0 && (
            <div className="space-y-3 text-left">
              <span className="block text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest">
                Selecciona los días que tienes disponibles
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {sortedSchedule.map((scheduleItem) => {
                  const isChecked = selectedSchedules.includes(scheduleItem.id!);
                  const { dayName, dayNumber, month } = formatScheduleDate(scheduleItem.date);
                  const dayNameShort = dayName.substring(0, 3).toUpperCase();
                  const isDisabled = isPending;
                  
                  return (
                    <button
                      key={scheduleItem.id}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => handleToggleSchedule(scheduleItem.id!)}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 ${
                        isDisabled ? 'cursor-default opacity-85' : 'cursor-pointer hover:bg-hover-overlay/5'
                      } ${
                        isChecked 
                          ? 'bg-purple border-purple text-white shadow-md' 
                          : 'bg-tertiary/40 border-border/40 text-muted-foreground'
                      }`}
                    >
                      <span className="text-[10px] font-extrabold tracking-widest">{dayNameShort} {dayNumber}</span>
                      <span className="text-body font-bold mt-1">
                        {isChecked ? 'Disponible' : 'No asisto'}
                      </span>
                      <span className={`text-[10px] mt-0.5 ${isChecked ? 'text-white/80' : 'text-muted-foreground/60'}`}>
                        {project.hide_schedule ? 'Horario por definir' : `${scheduleItem.startTime} - ${scheduleItem.endTime}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Panel de Confirmación o Mensaje de Decisión */}
          {!isExpired && (
            <div className="space-y-4 pt-4 border-t border-border/40">
              {/* Banners Informativos de Estado Actual (Plazo Abierto) */}
              {localStatus && (
                <div className="space-y-3 mb-2">
                  {localStatus === 'applied' ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl flex items-center gap-3 text-left shadow-sm">
                      <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                      <div>
                        <span className="block text-xs font-extrabold tracking-wider uppercase">¡Decisión Enviada!</span>
                        <span className="block text-[10px] opacity-90 font-medium">
                          Confirmaste tu asistencia. Puedes cambiar de opinión o disponibilidad y guardar una nueva respuesta mientras la propuesta siga abierta.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 p-4 rounded-xl flex items-center gap-3 text-left shadow-sm">
                      <X className="h-4.5 w-4.5 text-rose-500 shrink-0" />
                      <div>
                        <span className="block text-xs font-extrabold tracking-wider uppercase">¡Propuesta Declinada!</span>
                        <span className="block text-[10px] opacity-90 font-medium">
                          Marcaste que no puedes participar. Puedes cambiar de opinión, seleccionar tus días y volver a Aceptar mientras la propuesta siga abierta.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <span className="block text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest text-center">
                ¿Confirmas tu disponibilidad para este trabajo?
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={async () => {
                    const success = await submitResponse(true);
                    if (success) setLocalStatus('applied');
                  }}
                  className="w-full bg-emerald-500/10 border border-emerald-500/25 hover:border-emerald-500/50 hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl flex items-center justify-between transition-all duration-200 cursor-pointer text-left active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                      <Check className="h-4 w-4 stroke-[3]" />
                    </div>
                    <div>
                      <span className="block text-xs font-extrabold tracking-wider uppercase">ACEPTAR</span>
                      <span className="block text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-medium">Confirmar asistencia</span>
                    </div>
                  </div>
                  <span className="text-emerald-600/60 dark:text-emerald-400/60 font-bold">→</span>
                </button>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={async () => {
                    const success = await submitResponse(false);
                    if (success) setLocalStatus('rejected');
                  }}
                  className="w-full bg-rose-500/10 border border-rose-500/25 hover:border-rose-500/50 hover:bg-rose-500/15 text-rose-600 dark:text-rose-400 p-4 rounded-xl flex items-center justify-between transition-all duration-200 cursor-pointer text-left active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-rose-500 flex items-center justify-center text-white">
                      <X className="h-4 w-4 stroke-[3]" />
                    </div>
                    <div>
                      <span className="block text-xs font-extrabold tracking-wider uppercase">DECLINAR</span>
                      <span className="block text-[10px] text-rose-600/80 dark:text-rose-400/80 font-medium">Rechazar propuesta</span>
                    </div>
                  </div>
                  <span className="text-rose-600/60 dark:text-rose-400/60 font-bold">→</span>
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
