'use client';

import * as React from 'react';
import Link from 'next/link';
import { Calendar, CalendarDays, CalendarCheck, DollarSign, MapPin, Check, X, ArrowLeft, Info, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useApplyForm } from './apply-form.logic';
import { ApplyFormProps } from './apply-form.types';
import { toTitleCase } from '@/lib/utils';
import { PROJECT_TYPES } from '@/lib/types';
import { timestampToGuatemalaDateTime } from '@/lib/actions/projects/helpers';
import { Button } from '@/components/ui/ds/button';
import { useModelI18n } from '@/lib/i18n/ModelI18nContext';
import gsap from 'gsap';

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
  const { t } = useModelI18n();
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

  const targetBrand = project.brand?.name || project.client_name || 'Cliente';
  const modelName = model.alias || model.full_name || 'Modelo';
  const modelFirstName = modelName.split(' ')[0];

  const overlayRef = React.useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      gsap.fromTo(node, 
        { opacity: 0 }, 
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
    }
  }, []);

  const modalRef = React.useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      gsap.fromTo(node, 
        { scale: 0.85, y: 15, opacity: 0 }, 
        { scale: 1, y: 0, opacity: 1, duration: 0.45, ease: 'back.out(1.5)' }
      );
    }
  }, []);

  const [localStatus, setLocalStatus] = React.useState<string | null>(model.model_status || null);
  const [showDecisionButtons, setShowDecisionButtons] = React.useState(!model.model_status);
  const isDatesDisabled = isPending || (!showDecisionButtons && localStatus !== null);

  const [modalState, setModalState] = React.useState<{
    isOpen: boolean;
    type: 'success' | 'rejected' | null;
    title: string;
    description: string;
  }>({
    isOpen: false,
    type: null,
    title: '',
    description: '',
  });

  // Sincronizar el estado cuando cambia desde la revalidación del servidor
  React.useEffect(() => {
    setLocalStatus(model.model_status || null);
    setShowDecisionButtons(!model.model_status);
  }, [model.model_status]);

  // Resetear el estado del modal únicamente al cargar/montar un nuevo proyecto
  React.useEffect(() => {
    setModalState({
      isOpen: false,
      type: null,
      title: '',
      description: '',
    });
  }, [project.id]);

  const datesConsolidated = React.useMemo(() => {
    if (sortedSchedule.length === 0) return 'No definido';
    if (sortedSchedule.length === 1) {
      return formatScheduleDate(sortedSchedule[0].date).fullDate;
    }
    const start = formatScheduleDate(sortedSchedule[0].date);
    const end = formatScheduleDate(sortedSchedule[sortedSchedule.length - 1].date);
    
    const year = new Date(sortedSchedule[0].date).getFullYear();
    return `${start.dayNumber} al ${end.dayNumber} de ${start.month}, ${year}`;
  }, [sortedSchedule]);

  const paymentStr = React.useMemo(() => {
    const fee = project.default_model_fee;
    const currency = (project.currency || 'GTQ').toUpperCase();
    if (!fee) return t.apply.feeTrade;
    const typeLabel = project.default_fee_type === 'per_hour' ? '/h' : project.default_fee_type === 'fixed' ? '' : t.apply.feePerDay;
    return `${currency} ${fee.toLocaleString()} ${typeLabel}`;
  }, [project.default_model_fee, project.default_fee_type, project.currency, t]);

  const isExpired = project.apply_end_at ? new Date() > new Date(project.apply_end_at) : false;
  const applyEnd = project.apply_end_at ? timestampToGuatemalaDateTime(project.apply_end_at) : null;

  return (
    <div className="w-full max-w-md mx-auto space-y-6 relative pb-8 text-left">
      
      {/* Header Volver */}
      <div className="flex items-center gap-4 mb-4">
        <Link
          href="/model/apply"
          className="h-10 w-10 rounded-full bg-[rgb(var(--ds-color-surface-container))] border border-[rgb(var(--ds-color-outline-variant))]/20 hover:bg-[rgb(var(--ds-color-primary))] hover:text-[rgb(var(--ds-color-primary-foreground))] text-[rgb(var(--ds-color-on-surface))] flex items-center justify-center transition-colors duration-200 shadow-sm shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="ds-text-sm font-bold text-[rgb(var(--ds-color-on-surface))] leading-tight">{t.apply.proposalTitle}</h2>
        </div>
      </div>

      {/* BOX 1: Límite para aplicar, Título y descripción */}
      <div className="w-full bg-[rgb(var(--ds-color-surface-container))] border border-[rgb(var(--ds-color-outline-variant))]/20 rounded-3xl p-6 shadow-md space-y-3">
        {applyEnd && (
          <div className="flex items-center gap-1.5 text-[rgb(var(--ds-color-error))] font-bold ds-text-xs">
            <span className="h-2 w-2 rounded-full bg-[rgb(var(--ds-color-error))] animate-pulse"></span>
            <span>
              Límite: {applyEnd.date.split('-')[2]} {['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][parseInt(applyEnd.date.split('-')[1], 10) - 1]}, {applyEnd.time}
            </span>
          </div>
        )}
        
        <div className="space-y-2">
          <h2 className="ds-text-lg font-bold text-[rgb(var(--ds-color-on-surface))] tracking-tight leading-tight pt-1">
            {project.project_name}
          </h2>
          {project.description && (
            <p className="ds-text-sm text-[rgb(var(--ds-color-on-surface))]/80 leading-relaxed whitespace-pre-line font-medium">
              {project.description}
            </p>
          )}
        </div>
      </div>

      {/* BOX 2: Pago, Ubicación y Fechas */}
      <div className="w-full bg-[rgb(var(--ds-color-surface-container))] border border-[rgb(var(--ds-color-outline-variant))]/20 rounded-3xl p-6 shadow-md space-y-4">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className="ds-text-xs font-bold text-[rgb(var(--ds-color-on-surface-variant))]/50">Pago</span>
            <span className="ds-text-sm font-bold text-[rgb(var(--ds-color-on-surface))]">{paymentStr}</span>
          </div>
          <div className="flex justify-between items-center border-t border-[rgb(var(--ds-color-outline-variant))]/10 pt-4">
            <span className="ds-text-xs font-bold text-[rgb(var(--ds-color-on-surface-variant))]/50">Ubicación</span>
            <span className="ds-text-sm font-bold text-[rgb(var(--ds-color-on-surface))]">{project.location || 'Guatemala'}</span>
          </div>
          <div className="flex justify-between items-center border-t border-[rgb(var(--ds-color-outline-variant))]/10 pt-4">
            <span className="ds-text-xs font-bold text-[rgb(var(--ds-color-on-surface-variant))]/50">{t.apply.datesTitle}</span>
            <span className="ds-text-sm font-bold text-[rgb(var(--ds-color-on-surface))]">{datesConsolidated}</span>
          </div>
        </div>
      </div>

      {/* Selector de disponibilidad */}
      {!isExpired && sortedSchedule.length > 0 && (
        <div className="w-full bg-[rgb(var(--ds-color-surface-container))] border border-[rgb(var(--ds-color-outline-variant))]/20 rounded-3xl p-6 shadow-md space-y-4">
          <div className="flex flex-col text-left">
            <h3 className="ds-text-sm font-bold text-[rgb(var(--ds-color-on-surface))]">{t.apply.selectAvailableDates}</h3>
          </div>

          <div className="flex flex-col divide-y divide-[rgb(var(--ds-color-outline-variant))]/10 pt-2">
            {sortedSchedule.map((scheduleItem) => {
              const isChecked = selectedSchedules.includes(scheduleItem.id!);
              const { dayName, dayNumber, month } = formatScheduleDate(scheduleItem.date);
              const fullDayName = `${dayName}, ${dayNumber} de ${month}`;
              const isDisabled = isDatesDisabled;

              return (
                <button
                  key={scheduleItem.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleToggleSchedule(scheduleItem.id!)}
                  className={`w-full py-4 flex items-center justify-between text-left transition-all duration-200 outline-none bg-transparent ${
                    isDisabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer active:scale-98'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-[rgb(var(--ds-color-primary))] ${isChecked ? 'opacity-100' : 'opacity-40'}`}>
                      {isChecked ? <CalendarCheck className="w-6 h-6" /> : <CalendarDays className="w-6 h-6" />}
                    </span>
                    <div>
                      <span className="ds-text-sm font-bold block text-[rgb(var(--ds-color-on-surface))]">{fullDayName}</span>
                      <span className="ds-text-xs text-[rgb(var(--ds-color-on-surface-variant))]/60 block mt-0.5">
                        {project.hide_schedule ? 'Horario por definir' : `${scheduleItem.startTime} - ${scheduleItem.endTime}`}
                      </span>
                    </div>
                  </div>
                  {/* Giant Checkbox */}
                  <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                    isChecked
                      ? 'bg-[rgb(var(--ds-color-primary))] border-[rgb(var(--ds-color-primary))] text-white'
                      : 'border-[rgb(var(--ds-color-outline-variant))]/30'
                  }`}>
                    {isChecked && <Check className="h-4.5 w-4.5 stroke-[3] text-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Si la convocatoria ya expiró/finalizó */}
      {isExpired ? (
        <div className="space-y-3 mb-2">
          <div className="bg-[rgb(var(--ds-color-surface-container-high))] border border-[rgb(var(--ds-color-outline-variant))]/20 p-6 rounded-3xl flex flex-col items-center text-center shadow-sm space-y-3">
            <div className="shrink-0">
              {localStatus === 'applied' ? (
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              ) : localStatus === 'rejected' ? (
                <XCircle className="h-8 w-8 text-rose-500" />
              ) : (
                <Clock className="h-8 w-8 text-amber-500" />
              )}
            </div>
            <div className="w-full space-y-1">
              <span className="block ds-text-sm font-bold leading-tight text-[rgb(var(--ds-color-on-surface))]">
                Convocatoria finalizada
              </span>
              <span className="block ds-text-xs opacity-80 font-medium leading-relaxed max-w-[280px] mx-auto text-[rgb(var(--ds-color-on-surface-variant))]">
                {localStatus === 'applied'
                  ? 'El periodo para aplicar a esta propuesta ha terminado. Dejaste registrado que sí estabas disponible para este proyecto.'
                  : localStatus === 'rejected'
                  ? 'El periodo para aplicar a esta propuesta ha terminado. Dejaste registrado que no podías participar.'
                  : 'El periodo para aplicar a esta propuesta ha terminado y no se registró ninguna respuesta.'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Banners Informativos de Estado Actual (Fondo Inverso del Surface, Centrado Horizontalmente) */}
          {!showDecisionButtons && localStatus && (
            <div className="space-y-3 mb-2">
              <div className="bg-[rgb(var(--ds-color-on-surface))] text-[rgb(var(--ds-color-surface))] p-6 rounded-3xl flex flex-col items-center text-center shadow-md border-0 space-y-3">
                <div className="shrink-0">
                  {localStatus === 'applied' ? (
                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                  ) : (
                    <XCircle className="h-8 w-8 text-rose-500" />
                  )}
                </div>
                <div className="w-full space-y-1">
                  <span className="block ds-text-sm font-bold leading-tight">
                    {localStatus === 'applied' ? 'Propuesta aceptada' : 'Propuesta declinada'}
                  </span>
                  <span className="block ds-text-xs opacity-80 font-medium leading-relaxed max-w-[280px] mx-auto">
                    {localStatus === 'applied'
                      ? 'Ahora solo hay que esperar la confirmación del cliente.'
                      : 'Marcaste que no puedes participar, pero puedes cambiar de opinión si lo deseas.'}
                  </span>
                </div>
                <Button
                  type="button"
                  onClick={() => setShowDecisionButtons(true)}
                  className="w-full mt-2 !bg-[rgb(var(--ds-color-surface))] !text-[rgb(var(--ds-color-on-surface))] !border-0 ds-text-xs font-bold"
                >
                  Cambiar de opinión
                </Button>
              </div>
            </div>
          )}

          {/* ACCIONES DE DECISIÓN (BOTONES GIGANTES) */}
          {showDecisionButtons && (
            <div className="grid grid-cols-1 gap-2.5 pt-4">
              <Button
                variant="primary"
                disabled={isPending}
                onClick={async () => {
                  const success = await submitResponse(true);
                  if (success) {
                    setLocalStatus('applied');
                    setShowDecisionButtons(false);
                    setModalState({
                      isOpen: true,
                      type: 'success',
                      title: '¡Propuesta aceptada! 🎉',
                      description: `Felicidades ${modelFirstName}, aplicaste para ${targetBrand}.\nHay que esperar la confirmación del cliente.`,
                    });
                  }
                }}
                className="w-full"
              >
                <span>Aceptar</span>
              </Button>

              <Button
                variant="outline"
                disabled={isPending}
                onClick={async () => {
                  const success = await submitResponse(false);
                  if (success) {
                    setLocalStatus('rejected');
                    setShowDecisionButtons(false);
                    setModalState({
                      isOpen: true,
                      type: 'rejected',
                      title: 'Propuesta rechazada',
                      description: `Declinaste la propuesta para ${targetBrand}.`,
                    });
                  }
                }}
                className="w-full !bg-[rgb(var(--ds-color-surface-container))] !border-[rgb(var(--ds-color-outline-variant))]/20 !text-[rgb(var(--ds-color-error))] hover:!bg-[rgb(var(--ds-color-surface-container-high))]"
              >
                <span>Rechazar</span>
              </Button>
            </div>
          )}
        </>
      )}

      {/* CONFIRMATION TACTILE MODAL */}
      {modalState.isOpen && (
        <div ref={overlayRef} className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/75 backdrop-blur-sm">
          <div ref={modalRef} className="bg-[rgb(var(--ds-color-surface-container))] border border-[rgb(var(--ds-color-outline-variant))]/20 w-full max-w-xs rounded-[32px] p-6 shadow-2xl text-center text-[rgb(var(--ds-color-on-surface))] space-y-4">
            
            <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
              modalState.type === 'success' ? 'bg-[rgb(var(--ds-color-primary))]/10 text-[rgb(var(--ds-color-primary))]' : 'bg-[rgb(var(--ds-color-error))]/10 text-[rgb(var(--ds-color-error))]'
            }`}>
              {modalState.type === 'success' ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
            </div>

            <h3 className="ds-text-lg font-bold tracking-tight leading-tight">{modalState.title}</h3>
            <p className="ds-text-xs text-[rgb(var(--ds-color-on-surface-variant))]/70 leading-relaxed px-1 whitespace-pre-line">{modalState.description}</p>

            <Link href="/model/apply" passHref legacyBehavior>
              <Button
                variant="primary"
                className="w-full !h-12 !rounded-xl ds-text-xs font-bold"
              >
                Listo
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
