'use client';

import * as React from 'react';
import Link from 'next/link';
import { Calendar, DollarSign, MapPin, Check, X, Clock, ArrowRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/ds/button';

interface Proposal {
  project_id: string;
  project_name: string;
  description?: string;
  location?: string;
  currency?: string;
  agreed_fee?: number;
  fee_type?: string;
  model_status?: string | null;
  apply_end_at?: string | null;
  public_id: string;
  schedule?: Array<{
    date: string;
    startTime: string;
    endTime: string;
  }>;
  gender_target?: string;
  client_selection?: string;
}

interface ClientProposalsFeedProps {
  proposals: Proposal[];
}

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function ClientProposalsFeed({ proposals }: ClientProposalsFeedProps) {
  const [activeTab, setActiveTab] = React.useState<'accepted' | 'declined'>('accepted');

  const now = React.useMemo(() => new Date(), []);

  const filteredProposals = React.useMemo(() => {
    return proposals.filter((p) => {
      const isExpired = p.apply_end_at ? new Date(p.apply_end_at) < now : false;

      // Check if project work dates have fully finished
      let isProjectFinished = false;
      if (p.schedule && p.schedule.length > 0) {
        const sorted = [...p.schedule].sort((a, b) => a.date.localeCompare(b.date));
        const lastSchedule = sorted[sorted.length - 1];
        const lastDate = new Date(`${lastSchedule.date}T23:59:59`);
        isProjectFinished = lastDate < now;
      }

      if (activeTab === 'accepted') {
        // Aceptadas: model_status === 'applied' o 'added_by_admin', no ha finalizado y no ha sido aprobada por el cliente (se movería al perfil)
        return (p.model_status === 'applied' || p.model_status === 'added_by_admin') && !isProjectFinished && p.client_selection !== 'approved';
      } else {
        // Declinadas: model_status === 'rejected' y no ha expirado la convocatoria
        return p.model_status === 'rejected' && !isExpired;
      }
    });
  }, [proposals, activeTab, now]);

  return (
    <div className="space-y-6 w-full">
      {/* Segmented Control (Pestañas de selección táctiles) */}
      <div className="w-full max-w-md mx-auto px-1">
        <div className="grid grid-cols-2 p-1.5 bg-[rgb(var(--ds-color-surface-container-high))] rounded-2xl border border-[rgb(var(--ds-color-outline-variant))]/10 relative">
          <button
            type="button"
            onClick={() => setActiveTab('accepted')}
            className={`py-3 rounded-xl ds-text-sm font-bold text-center transition-all cursor-pointer select-none active:scale-95 duration-200 border-0 outline-none ${
              activeTab === 'accepted'
                ? 'bg-[rgb(var(--ds-color-primary))] text-[rgb(var(--ds-color-primary-foreground))] shadow-sm'
                : 'bg-transparent text-[rgb(var(--ds-color-on-surface-variant))]/70 hover:text-[rgb(var(--ds-color-on-surface))]'
            }`}
          >
            Aceptadas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('declined')}
            className={`py-3 rounded-xl ds-text-sm font-bold text-center transition-all cursor-pointer select-none active:scale-95 duration-200 border-0 outline-none ${
              activeTab === 'declined'
                ? 'bg-[rgb(var(--ds-color-primary))] text-[rgb(var(--ds-color-primary-foreground))] shadow-sm'
                : 'bg-transparent text-[rgb(var(--ds-color-on-surface-variant))]/70 hover:text-[rgb(var(--ds-color-on-surface))]'
            }`}
          >
            Declinadas
          </button>
        </div>
      </div>

      {/* Listado de Propuestas */}
      {filteredProposals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 rounded-3xl bg-[rgb(var(--ds-color-surface-container))]/30 border border-dashed border-[rgb(var(--ds-color-outline-variant))]/20 w-full text-center">
          <Calendar className="h-10 w-10 text-[rgb(var(--ds-color-on-surface-variant))]/40 mb-4 animate-pulse" />
          <h4 className="text-[rgb(var(--ds-color-on-surface))] font-bold ds-text-sm">
            {activeTab === 'accepted' ? 'No tienes propuestas aceptadas' : 'No tienes propuestas declinadas'}
          </h4>
          <p className="ds-text-xs text-[rgb(var(--ds-color-on-surface-variant))]/70 max-w-xs mt-2 leading-relaxed">
            {activeTab === 'accepted'
              ? 'Aquí aparecerán las propuestas que hayas aceptado y estén pendientes de revisión del cliente.'
              : 'Aquí se listarán las propuestas que hayas declinado durante su periodo de convocatoria activa.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {filteredProposals.map((p) => {
            // Formatear rango de fechas consolidadas
            let datesConsolidated = 'No definido';
            if (p.schedule && p.schedule.length > 0) {
              const sorted = [...p.schedule].sort((a, b) => a.date.localeCompare(b.date));
              if (sorted.length === 1) {
                const dateObj = new Date(`${sorted[0].date}T00:00:00`);
                datesConsolidated = `${WEEKDAYS[dateObj.getDay()]}, ${dateObj.getDate()} de ${MONTHS_SHORT[dateObj.getMonth()]}`;
              } else {
                const startObj = new Date(`${sorted[0].date}T00:00:00`);
                const endObj = new Date(`${sorted[sorted.length - 1].date}T00:00:00`);
                datesConsolidated = `${startObj.getDate()} de ${MONTHS_SHORT[startObj.getMonth()]} al ${endObj.getDate()} de ${MONTHS_SHORT[endObj.getMonth()]}, ${startObj.getFullYear()}`;
              }
            }

            // Formatear pago
            const fee = p.agreed_fee || 0;
            const currency = (p.currency || 'GTQ').toUpperCase();
            const typeLabel = p.fee_type === 'per_hour' ? 'Por Hora' : p.fee_type === 'fixed' ? 'Monto Fijo' : 'Por Día';
            const paymentStr = fee ? `${currency} ${fee.toLocaleString()} ${typeLabel}` : 'Canje';

            // Configurar el Badge de Estado
            let badgeColor = '';
            let badgeText = '';
            let badgeIcon = null;

            if (p.model_status === 'applied' || p.model_status === 'added_by_admin') {
              badgeColor = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400';
              badgeIcon = <Check className="h-4 w-4 stroke-[3.5] text-emerald-500" />;
            } else if (p.model_status === 'rejected') {
              badgeColor = 'bg-rose-500/10 border-rose-500/20 text-rose-500';
              badgeIcon = <X className="h-4 w-4 stroke-[3.5] text-rose-500" />;
            } else {
              badgeColor = 'bg-amber-500/10 border-amber-500/20 text-amber-500';
              badgeIcon = <Clock className="h-4 w-4 text-amber-500" />;
            }

            return (
              <div
                key={p.project_id}
                className="bg-[rgb(var(--ds-color-surface-container))] border border-[rgb(var(--ds-color-outline-variant))]/20 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-6 hover:shadow-lg transition-all duration-200 w-full"
              >
                <div className="space-y-4">
                  {/* Header de la tarjeta */}
                  <div className="flex justify-between items-center gap-4">
                    <div className="text-left">
                      <h4 className="ds-text-sm font-bold text-[rgb(var(--ds-color-on-surface))] leading-tight">
                        {p.project_name}
                      </h4>
                    </div>
                    <span className={`h-8 w-8 rounded-full flex items-center justify-center border shrink-0 ${badgeColor}`}>
                      {badgeIcon}
                    </span>
                  </div>

                  {p.description && (
                    <p className="ds-text-xs text-[rgb(var(--ds-color-on-surface-variant))] line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  )}

                  {/* Detalles (Pago, Fecha, Lugar, Género) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ds-text-xs pt-2">
                    <div className="flex items-center gap-2 text-[rgb(var(--ds-color-on-surface-variant))]">
                      <Calendar className="h-4 w-4 text-[rgb(var(--ds-color-primary))] shrink-0" />
                      <span className="truncate font-semibold text-[rgb(var(--ds-color-on-surface))]">{datesConsolidated}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[rgb(var(--ds-color-on-surface-variant))]">
                      <DollarSign className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span className="truncate font-semibold text-[rgb(var(--ds-color-on-surface))]">{paymentStr}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[rgb(var(--ds-color-on-surface-variant))]">
                      <MapPin className="h-4 w-4 text-[rgb(var(--ds-color-primary))] shrink-0" />
                      <span className="truncate font-semibold text-[rgb(var(--ds-color-on-surface))]">{p.location || 'Guatemala'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[rgb(var(--ds-color-on-surface-variant))]">
                      <Users className={`h-4 w-4 ${
                        (p.gender_target || 'Todos').toLowerCase() === 'hombres'
                          ? 'text-sky-500'
                          : (p.gender_target || 'Todos').toLowerCase() === 'mujeres'
                          ? 'text-pink-500'
                          : 'text-[rgb(var(--ds-color-primary))]'
                      } shrink-0`} />
                      <span className="truncate font-semibold text-[rgb(var(--ds-color-on-surface))]">Género: {p.gender_target || 'Todos'}</span>
                    </div>
                  </div>
                </div>

                {/* Acción */}
                <div className="pt-2 border-t border-[rgb(var(--ds-color-outline-variant))]/20">
                  <Link href={`/m/${p.public_id}`} passHref legacyBehavior>
                    <Button
                      variant={p.model_status ? 'outline' : 'primary'}
                      className="w-full !h-11 !rounded-xl ds-text-xs font-bold"
                    >
                      <span>{p.model_status ? 'Modificar decisión' : 'Ver Detalles y Responder'}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
