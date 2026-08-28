'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  CalendarCheck,
  Check,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  MessageCircle,
} from 'lucide-react';
import { useApplyForm } from './apply-form.logic';
import { ApplyFormProps } from './apply-form.types';
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

const formatScheduleDate = (dateStr: string, locale: string) => {
  const date = new Date(`${dateStr}T00:00:00`);
  const isEn = locale === 'en';
  const dayOfWeek = date.getDay();
  const dayNumber = date.getDate();
  const monthIndex = date.getMonth();

  const dayName = isEn
    ? date.toLocaleDateString('en-US', { weekday: 'short' })
    : WEEKDAYS_SHORT[dayOfWeek];
  const month = isEn
    ? date.toLocaleDateString('en-US', { month: 'short' })
    : MONTHS_SHORT[monthIndex];
  const fullDayName = isEn
    ? `${dayName}, ${month} ${dayNumber}`
    : `${dayName}, ${dayNumber} de ${month}`;
  const fullDate = isEn
    ? date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : `${WEEKDAYS[dayOfWeek]}, ${dayNumber} de ${MONTHS[monthIndex]}`;

  return {
    dayName,
    dayNumber,
    month,
    fullDayName,
    fullDate,
  };
};

export function ApplyForm({ project, model }: ApplyFormProps) {
  const { t, locale } = useModelI18n();

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

  // Validaciones de género
  const hasAssignedGender = Boolean(model.gender && (model.gender === 'Male' || model.gender === 'Female'));
  const isMale = model.gender === 'Male';
  const isFemale = model.gender === 'Female';

  const getGenderTargetLabel = React.useCallback(
    (target?: 'Todos' | 'Hombres' | 'Mujeres' | null) => {
      if (target === 'Hombres') return t.apply.men;
      if (target === 'Mujeres') return t.apply.women;
      return target?.toLowerCase() || '';
    },
    [t]
  );

  const getScheduleGenderEligibility = React.useCallback(
    (scheduleItem: { gender_target?: 'Todos' | 'Hombres' | 'Mujeres' | null }) => {
      const target = scheduleItem.gender_target || project.gender_target || 'Todos';
      if (!hasAssignedGender) {
        return {
          isEligible: false,
          label: t.apply.genderRequired,
        };
      }
      if (target === 'Hombres' && !isMale) {
        return {
          isEligible: false,
          label: t.apply.menOnly,
        };
      }
      if (target === 'Mujeres' && !isFemale) {
        return {
          isEligible: false,
          label: t.apply.womenOnly,
        };
      }
      const genderLabel = getGenderTargetLabel(target);
      return {
        isEligible: true,
        label: target === 'Todos' ? null : t.apply.onlyGender.replace('{gender}', genderLabel),
      };
    },
    [hasAssignedGender, isMale, isFemale, project.gender_target, t, getGenderTargetLabel]
  );

  const eligibleSchedules = React.useMemo(() => {
    return sortedSchedule.filter((s) => getScheduleGenderEligibility(s).isEligible);
  }, [sortedSchedule, getScheduleGenderEligibility]);

  const hasEligibleDates = eligibleSchedules.length > 0;
  const isProjectGenderIncompatible =
    hasAssignedGender &&
    ((project.gender_target === 'Hombres' && !isMale) ||
      (project.gender_target === 'Mujeres' && !isFemale));

  const canApplyGlobally = hasAssignedGender && hasEligibleDates && !isProjectGenderIncompatible;

  const initialSchedules = React.useMemo(() => {
    if (model.model_available_schedules !== null && model.model_available_schedules !== undefined) {
      // Filtrar solo los que sean elegibles para este modelo
      return model.model_available_schedules.filter((id) => {
        const item = sortedSchedule.find((s) => s.id === id);
        return item ? getScheduleGenderEligibility(item).isEligible : true;
      });
    }
    return [];
  }, [model.model_available_schedules, sortedSchedule, getScheduleGenderEligibility]);

  const {
    selectedSchedules,
    handleToggleSchedule,
    isPending,
    submitResponse,
  } = useApplyForm(project.id, model.id, initialSchedules);

  const targetBrand = project.brand?.name || project.client_name || 'Cliente';
  const modelName = model.alias || model.full_name || 'Modelo';
  const modelFirstName = modelName.split(' ')[0];

  const getNoGenderSupportWhatsappUrl = () => {
    const destination = '50247388666';
    const text = `Hola, estoy intentando aplicar al proyecto "${project.project_name}", pero mi perfil no tiene asignado género (${modelName}). ¿Podrían ayudarme a configurarlo en la agencia?`;
    return `https://wa.me/${destination}?text=${encodeURIComponent(text)}`;
  };

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
  const [showDecisionButtons, setShowDecisionButtons] = React.useState(!model.model_status || model.model_status === 'pending');
  const isDatesDisabled = isPending || (!showDecisionButtons && localStatus !== null && localStatus !== 'pending') || !canApplyGlobally;

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
    setShowDecisionButtons(!model.model_status || model.model_status === 'pending');
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
    if (sortedSchedule.length === 0) return t.apply.notDefined;
    if (sortedSchedule.length === 1) {
      return formatScheduleDate(sortedSchedule[0].date, locale).fullDate;
    }
    const start = formatScheduleDate(sortedSchedule[0].date, locale);
    const end = formatScheduleDate(sortedSchedule[sortedSchedule.length - 1].date, locale);
    
    const year = new Date(sortedSchedule[0].date).getFullYear();
    if (locale === 'en') {
      return `${start.month} ${start.dayNumber} ${t.apply.to} ${end.month} ${end.dayNumber}, ${year}`;
    }
    return `${start.dayNumber} ${t.apply.to} ${end.dayNumber} ${t.apply.of} ${start.month}, ${year}`;
  }, [sortedSchedule, locale, t]);

  const paymentStr = React.useMemo(() => {
    const fee = project.default_model_fee;
    const currency = (project.currency || 'GTQ').toUpperCase();
    if (!fee) return t.apply.feeTrade;
    const typeLabel = project.default_fee_type === 'per_hour' ? '/h' : project.default_fee_type === 'fixed' ? '' : ` ${t.apply.feePerDay}`;
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
          className="h-10 w-10 rounded-full bg-[rgb(var(--ds-color-surface-container))] border border-[rgb(var(--ds-color-outline-variant))]/20 hover:bg-[rgb(var(--ds-color-primary))] hover:text-[rgb(var(--ds-color-primary-foreground))] text-[rgb(var(--ds-color-on-surface))] flex items-center justify-center transition-colors duration-200 shadow-xs shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="ds-text-sm font-bold text-[rgb(var(--ds-color-on-surface))] leading-tight">{t.apply.proposalTitle}</h2>
        </div>
      </div>

      {/* AVISO CRÍTICO 1: Perfil sin género asignado */}
      {!hasAssignedGender && (
        <div className="w-full bg-[rgb(var(--ds-color-surface-container-high))] border border-[rgb(var(--ds-color-warning))]/30 rounded-3xl p-6 shadow-md space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-2xl bg-[rgb(var(--ds-color-warning))]/15 text-[rgb(var(--ds-color-warning))] shrink-0 mt-0.5">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="ds-text-sm font-bold text-[rgb(var(--ds-color-on-surface))] leading-tight">
                {t.apply.noGenderAssignedTitle}
              </h3>
              <p className="ds-text-xs text-[rgb(var(--ds-color-on-surface-variant))]/80 leading-relaxed font-medium">
                {t.apply.noGenderAssignedDesc}
              </p>
            </div>
          </div>
          <a
            href={getNoGenderSupportWhatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-12 rounded-xl bg-[rgb(var(--ds-color-surface-container-lowest))] border border-[rgb(var(--ds-color-outline-variant))]/30 text-[rgb(var(--ds-color-on-surface))] hover:bg-[rgb(var(--ds-color-surface))] flex items-center justify-center gap-2 ds-text-xs font-bold transition-all duration-200 cursor-pointer shadow-xs active:scale-98"
          >
            <MessageCircle className="w-4 h-4 text-[rgb(var(--ds-color-primary))]" />
            <span>{t.apply.contactAdminWhatsapp}</span>
          </a>
        </div>
      )}

      {/* AVISO CRÍTICO 2: Convocatoria no disponible para el género del modelo */}
      {hasAssignedGender && (!hasEligibleDates || isProjectGenderIncompatible) && (
        <div className="w-full bg-[rgb(var(--ds-color-surface-container))] border border-[rgb(var(--ds-color-error))]/25 rounded-3xl p-6 shadow-md space-y-2">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-2xl bg-[rgb(var(--ds-color-error))]/15 text-[rgb(var(--ds-color-error))] shrink-0 mt-0.5">
              <XCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="ds-text-sm font-bold text-[rgb(var(--ds-color-on-surface))] leading-tight">
                {isProjectGenderIncompatible
                  ? t.apply.projectExclusiveFor.replace('{gender}', getGenderTargetLabel(project.gender_target))
                  : t.apply.noDatesAvailableForGender}
              </h3>
              <p className="ds-text-xs text-[rgb(var(--ds-color-on-surface-variant))]/80 leading-relaxed font-medium">
                {t.apply.projectSegmentedFor.replace('{gender}', project.gender_target ? getGenderTargetLabel(project.gender_target) : t.apply.otherGender)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* BOX 1: Límite para aplicar, Título y descripción */}
      <div className="w-full bg-[rgb(var(--ds-color-surface-container))] border border-[rgb(var(--ds-color-outline-variant))]/20 rounded-3xl p-6 shadow-md space-y-3">
        {applyEnd && (
          <div className="flex items-center gap-1.5 text-[rgb(var(--ds-color-error))] font-bold ds-text-xs">
            <span className="h-2 w-2 rounded-full bg-[rgb(var(--ds-color-error))] animate-pulse"></span>
            <span>
              {t.apply.deadline}: {(() => {
                const monthNum = parseInt(applyEnd.date.split('-')[1], 10) - 1;
                const dayNum = applyEnd.date.split('-')[2];
                const monthName = locale === 'en'
                  ? ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][monthNum]
                  : MONTHS_SHORT[monthNum];
                return locale === 'en'
                  ? `${monthName} ${dayNum}, ${applyEnd.time}`
                  : `${dayNum} ${monthName}, ${applyEnd.time}`;
              })()}
            </span>
          </div>
        )}
        
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h2 className="ds-text-lg font-bold text-[rgb(var(--ds-color-on-surface))] tracking-tight leading-tight pt-1">
              {project.project_name}
            </h2>
            {project.gender_target && project.gender_target !== 'Todos' && (
              <span className="px-2.5 py-1 rounded-full ds-text-xs font-bold bg-[rgb(var(--ds-color-surface-container-high))] text-[rgb(var(--ds-color-primary))] border border-[rgb(var(--ds-color-outline-variant))]/20 shrink-0">
                {t.apply.onlyGender.replace('{gender}', getGenderTargetLabel(project.gender_target))}
              </span>
            )}
          </div>
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
            <span className="ds-text-xs font-bold text-[rgb(var(--ds-color-on-surface-variant))]/50">{t.apply.payment}</span>
            <span className="ds-text-sm font-bold text-[rgb(var(--ds-color-on-surface))]">{paymentStr}</span>
          </div>
          <div className="flex justify-between items-center border-t border-[rgb(var(--ds-color-outline-variant))]/10 pt-4">
            <span className="ds-text-xs font-bold text-[rgb(var(--ds-color-on-surface-variant))]/50">{t.apply.location}</span>
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
          <div className="flex items-center justify-between">
            <h3 className="ds-text-sm font-bold text-[rgb(var(--ds-color-on-surface))]">{t.apply.selectAvailableDates}</h3>
          </div>

          <div className="flex flex-col divide-y divide-[rgb(var(--ds-color-outline-variant))]/10 pt-2">
            {sortedSchedule.map((scheduleItem) => {
              const isChecked = selectedSchedules.includes(scheduleItem.id!);
              const { fullDayName } = formatScheduleDate(scheduleItem.date, locale);
              const eligibility = getScheduleGenderEligibility(scheduleItem);
              const isDisabled = isDatesDisabled || !eligibility.isEligible;

              return (
                <button
                  key={scheduleItem.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    if (eligibility.isEligible) {
                      handleToggleSchedule(scheduleItem.id!);
                    }
                  }}
                  className={`w-full py-4 flex items-center justify-between text-left transition-all duration-200 outline-none bg-transparent ${
                    isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer active:scale-98'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-[rgb(var(--ds-color-primary))] ${isChecked ? 'opacity-100' : 'opacity-40'}`}>
                      {isChecked ? <CalendarCheck className="w-6 h-6" /> : <CalendarDays className="w-6 h-6" />}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="ds-text-sm font-bold block text-[rgb(var(--ds-color-on-surface))]">{fullDayName}</span>
                        {eligibility.label && !eligibility.isEligible && (
                          <span className="ds-text-xs font-bold text-[rgb(var(--ds-color-error))]">
                            ({eligibility.label})
                          </span>
                        )}
                        {eligibility.label && eligibility.isEligible && (
                          <span className="ds-text-xs text-[rgb(var(--ds-color-on-surface-variant))]/60">
                            ({eligibility.label})
                          </span>
                        )}
                      </div>
                      <span className="ds-text-xs text-[rgb(var(--ds-color-on-surface-variant))]/60 block mt-0.5">
                        {project.hide_schedule ? t.apply.scheduleTBD : `${scheduleItem.startTime} - ${scheduleItem.endTime}`}
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
          <div className="bg-[rgb(var(--ds-color-surface-container-high))] border border-[rgb(var(--ds-color-outline-variant))]/20 p-6 rounded-3xl flex flex-col items-center text-center shadow-xs space-y-3">
            <div className="shrink-0">
              {localStatus === 'applied' ? (
                <CheckCircle2 className="h-8 w-8 text-[rgb(var(--ds-color-primary))]" />
              ) : localStatus === 'rejected' ? (
                <XCircle className="h-8 w-8 text-[rgb(var(--ds-color-error))]" />
              ) : (
                <Clock className="h-8 w-8 text-[rgb(var(--ds-color-warning))]" />
              )}
            </div>
            <div className="w-full space-y-1">
              <span className="block ds-text-sm font-bold leading-tight text-[rgb(var(--ds-color-on-surface))]">
                {t.apply.callFinished}
              </span>
              <span className="block ds-text-xs opacity-80 font-medium leading-relaxed max-w-[280px] mx-auto text-[rgb(var(--ds-color-on-surface-variant))]">
                {localStatus === 'applied'
                  ? t.apply.callFinishedApplied
                  : localStatus === 'rejected'
                  ? t.apply.callFinishedRejected
                  : t.apply.callFinishedNone}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Banners Informativos de Estado Actual (Fondo Inverso del Surface, Centrado Horizontalmente) */}
          {!showDecisionButtons && localStatus && localStatus !== 'pending' && (
            <div className="space-y-3 mb-2">
              <div className="bg-[rgb(var(--ds-color-on-surface))] text-[rgb(var(--ds-color-surface))] p-6 rounded-3xl flex flex-col items-center text-center shadow-md border-0 space-y-3">
                <div className="shrink-0">
                  {localStatus === 'applied' ? (
                    <CheckCircle2 className="h-8 w-8 text-[rgb(var(--ds-color-primary))]" />
                  ) : (
                    <XCircle className="h-8 w-8 text-[rgb(var(--ds-color-error))]" />
                  )}
                </div>
                <div className="w-full space-y-1">
                  <span className="block ds-text-sm font-bold leading-tight">
                    {localStatus === 'applied' ? t.apply.proposalAccepted : t.apply.proposalDeclined}
                  </span>
                  <span className="block ds-text-xs opacity-80 font-medium leading-relaxed max-w-[280px] mx-auto">
                    {localStatus === 'applied'
                      ? t.apply.waitingClientConfirmation
                      : t.apply.markedCannotParticipate}
                  </span>
                </div>
                {canApplyGlobally && (
                  <Button
                    type="button"
                    onClick={() => setShowDecisionButtons(true)}
                    className="w-full mt-2 !bg-[rgb(var(--ds-color-surface))] !text-[rgb(var(--ds-color-on-surface))] !border-0 ds-text-xs font-bold"
                  >
                    {t.apply.changeMind}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* ACCIONES DE DECISIÓN (BOTONES GIGANTES) */}
          {showDecisionButtons && (
            <div className="grid grid-cols-1 gap-2.5 pt-4">
              {canApplyGlobally && (
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
                        title: t.apply.successModalTitle,
                        description: t.apply.successModalDesc.replace('{name}', modelFirstName).replace('{brand}', targetBrand),
                      });
                    }
                  }}
                  className="w-full"
                >
                  <span>{t.apply.accept}</span>
                </Button>
              )}

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
                      title: t.apply.rejectedModalTitle,
                      description: t.apply.rejectedModalDesc.replace('{brand}', targetBrand),
                    });
                  }
                }}
                className="w-full !bg-[rgb(var(--ds-color-surface-container))] !border-[rgb(var(--ds-color-outline-variant))]/20 !text-[rgb(var(--ds-color-error))] hover:!bg-[rgb(var(--ds-color-surface-container-high))]"
              >
                <span>{t.apply.reject}</span>
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
                {t.apply.done}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
