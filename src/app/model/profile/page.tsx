import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getLoggedInModel, getAppliedProjectsForModel } from '@/lib/actions/models_portal';
import { ProfileDetails } from './_profile-details/profile-details';
import { JobHistory } from './_job-history/job-history';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Bell, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Mi Perfil — Portal de Modelos',
  description: 'Revisa tu información personal, edita tus redes y ve el historial de tus postulaciones.',
};

export default function ModelProfilePage() {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 py-6">
      <Suspense fallback={<div className="text-center text-body text-muted-foreground">Cargando perfil...</div>}>
        <ProfileContent />
      </Suspense>
    </div>
  );
}

async function ProfileContent() {
  // 1. Verificar sesión del modelo
  const model = await getLoggedInModel();
  if (!model) {
    redirect('/model/login?redirectTo=/model/profile');
  }

  // 2. Cargar proyectos aplicados
  const allAppliedProjects = await getAppliedProjectsForModel(model.id);

  // Filtrar: solo mostrar en el historial del workspace proyectos a los que ya postuló,
  // que ya fueron aprobados por el cliente y que no sean borradores.
  const CUTOFF_DATE = '2026-06';
  const appliedProjects = allAppliedProjects.filter((p) => {
    if (p.model_status !== 'applied' && p.model_status !== 'added_by_admin') return false;
    if (p.status === 'draft') return false;
    if (p.client_selection !== 'approved') return false;
    const dateStr = p.schedule && p.schedule[0] ? p.schedule[0].date : p.created_at;
    if (!dateStr) return false;
    const yearMonth = dateStr.slice(0, 7); // 'YYYY-MM'
    return yearMonth >= CUTOFF_DATE;
  });

  // 3. Identificar si hay alguna propuesta de trabajo pendiente con plazo para aplicar y que no haya expirado
  const pendingInvitation = allAppliedProjects.find(
    (p) => 
      (p.model_status === 'pending' || !p.model_status) && 
      p.public_id && 
      p.apply_end_at && 
      new Date(p.apply_end_at).getTime() > Date.now()
  );

  // 4. Calcular KPIs
  const totalProjects = appliedProjects.length;
  const approvedCount = appliedProjects.filter((p) => p.client_selection === 'approved').length;

  // Ingresos en GTQ: sumamos agreed_fee únicamente de los proyectos aprobados que ya fueron pagados (isPaid === true)
  const totalIncome = appliedProjects
    .filter((p) => p.client_selection === 'approved' && p.isPaid)
    .reduce((sum, p) => {
      const daysCount = p.assignments?.length || p.schedule?.length || 1;
      const fee = p.agreed_fee || 0;
      const totalFee = p.fee_type === 'fixed' ? fee : fee * daysCount;
      return sum + totalFee;
    }, 0);

  return (
    <div className="space-y-6">
      


      {/* Banner de Propuesta Pendiente */}
      {pendingInvitation && (
        <div className="bg-purple/10 border border-purple/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_0_15px_rgba(112,67,236,0.08)] transition-all">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-purple/20 text-purple flex items-center justify-center shrink-0 relative">
              <Bell className="h-5 w-5 text-purple" />
              <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-purple animate-ping"></span>
              <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-purple"></span>
            </div>
            <div className="text-left">
              <h4 className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                Propuesta de trabajo disponible
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-purple/20 text-purple uppercase tracking-wider">Nuevo</span>
              </h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {pendingInvitation.project_name} requiere tu confirmación.
              </p>
            </div>
          </div>
          <Link
            href={`/m/${pendingInvitation.public_id}`}
            className="bg-purple text-white hover:bg-purple/90 px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto border-0 cursor-pointer shadow-sm"
          >
            <span>Ver Detalles</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Diseño de Rejilla de Dos Columnas en Escritorio (lg), Apilado en Móvil */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
        {/* Columna Izquierda: Perfil del Modelo */}
        <div className="lg:col-span-5 w-full space-y-6">
          <ProfileDetails
            model={model}
            totalProjects={totalProjects}
            approvedCount={approvedCount}
            totalIncome={totalIncome}
          />
        </div>

        {/* Columna Derecha: Historial de Proyectos */}
        <div className="lg:col-span-7 w-full space-y-6">
          {/* KPIs en una fila de 2 columnas, solo visible en escritorio (lg) */}
          <div className="hidden lg:grid lg:grid-cols-2 gap-4">
            {/* Proyectos */}
            <div className="bg-[rgb(var(--ds-color-surface-container))] border border-[rgb(var(--ds-color-outline-variant))]/20 rounded-2xl p-5 shadow-sm text-left">
              <span className="ds-text-xs text-muted-foreground font-bold tracking-wider block">Proyectos</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-foreground tracking-tight">
                  {String(totalProjects).padStart(2, '0')}
                </span>
                <span className="text-purple ds-text-xs font-bold">
                  {approvedCount} aprobados
                </span>
              </div>
            </div>

            {/* Ingresos */}
            <div className="bg-[rgb(var(--ds-color-surface-container))] border border-[rgb(var(--ds-color-outline-variant))]/20 rounded-2xl p-5 shadow-sm text-left">
              <span className="ds-text-xs text-muted-foreground font-bold tracking-wider block">Ingresos</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-2xl font-black text-[rgb(var(--ds-color-on-surface))] tracking-tight">
                  GTQ {totalIncome.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <JobHistory projects={appliedProjects} />
        </div>
      </div>

    </div>
  );
}
