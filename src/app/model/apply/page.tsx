import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getLoggedInModel, getAppliedProjectsForModel } from '@/lib/actions/models_portal';
import { Suspense } from 'react';
import { Calendar, DollarSign, MapPin, Check, X, Clock, ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Propuestas de Trabajo — Portal de Modelos',
  description: 'Confirma tu disponibilidad para los proyectos activos.',
};

export default function ModelApplyPage() {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 py-6 text-left">
      <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider">Propuestas de Trabajo</h3>
      <Suspense fallback={<div className="text-center text-body text-muted-foreground">Cargando propuestas...</div>}>
        <ActiveProposalsContent />
      </Suspense>
    </div>
  );
}

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

async function ActiveProposalsContent() {
  const model = await getLoggedInModel();
  if (!model) {
    redirect('/model/login?redirectTo=/model/apply');
  }

  const allAppliedProjects = await getAppliedProjectsForModel(model.id);

  // Active projects: application deadline in the future or not defined
  const now = new Date();
  const activeProjects = allAppliedProjects.filter((p) => {
    if (!p.apply_end_at) return true;
    return new Date(p.apply_end_at) > now;
  });

  if (activeProjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 rounded-2xl bg-tertiary/20 border border-dashed border-border/60 w-full">
        <Calendar className="h-10 w-10 text-muted-foreground/50 mb-4 animate-pulse" />
        <h4 className="text-foreground font-extrabold text-sm">No tienes propuestas activas</h4>
        <p className="text-xs text-muted-foreground text-center max-w-xs mt-2 leading-relaxed">
          En este momento no hay convocatorias abiertas asignadas a tu perfil. Te notificaremos cuando tengamos nuevos castings.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
      {activeProjects.map((p) => {
        // Consolidated Date string
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

        // Payment text
        const fee = p.agreed_fee || 0;
        const currency = (p.currency || 'GTQ').toUpperCase();
        const typeLabel = p.fee_type === 'per_hour' ? 'Por Hora' : p.fee_type === 'fixed' ? 'Monto Fijo' : 'Por Día';
        const paymentStr = fee ? `${currency} ${fee.toLocaleString()} ${typeLabel}` : 'Canje';

        // Status Badge details
        let badgeColor = '';
        let badgeText = '';
        let badgeIcon = null;

        if (p.model_status === 'applied') {
          badgeColor = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500';
          badgeText = 'Postulado';
          badgeIcon = <Check className="h-3 w-3 stroke-[3]" />;
        } else if (p.model_status === 'rejected') {
          badgeColor = 'bg-rose-500/10 border-rose-500/20 text-rose-500';
          badgeText = 'Declinado';
          badgeIcon = <X className="h-3 w-3 stroke-[3]" />;
        } else {
          badgeColor = 'bg-amber-500/10 border-amber-500/20 text-amber-500';
          badgeText = 'Pendiente';
          badgeIcon = <Clock className="h-3 w-3" />;
        }

        return (
          <div
            key={p.project_id}
            className="bg-card border border-border/60 rounded-2xl p-6 shadow-md flex flex-col justify-between space-y-6 hover:shadow-lg transition-all duration-200 w-full"
          >
            <div className="space-y-4">
              {/* Header block */}
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1 text-left">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Propuesta Abierta
                  </span>
                  <h4 className="text-body font-extrabold text-foreground leading-tight">
                    {p.project_name}
                  </h4>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold border rounded-full shrink-0 ${badgeColor}`}>
                  {badgeIcon}
                  {badgeText}
                </span>
              </div>

              {p.description && (
                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                  {p.description}
                </p>
              )}

              {/* Detail list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 text-purple shrink-0" />
                  <span className="truncate font-medium text-foreground">{datesConsolidated}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate font-medium text-foreground">{paymentStr}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground sm:col-span-2">
                  <MapPin className="h-3.5 w-3.5 text-purple shrink-0" />
                  <span className="truncate font-medium text-foreground">{p.location || 'Guatemala'}</span>
                </div>
              </div>
            </div>

            {/* CTA action */}
            <div className="pt-2 border-t border-border/40">
              <Link
                href={`/m/${p.public_id}`}
                className={`w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all text-xs border cursor-pointer ${
                  p.model_status 
                    ? 'bg-transparent border-border hover:bg-hover-overlay/5 text-foreground' 
                    : 'bg-purple border-purple hover:bg-purple/90 text-white shadow-sm'
                }`}
              >
                <span>{p.model_status ? 'Modificar disponibilidad / Cambiar opinión' : 'Confirmar disponibilidad'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
