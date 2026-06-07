import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getLoggedInModel, getAppliedProjectsForModel } from '@/lib/actions/models_portal';
import { ProfileDetails } from './_profile-details/profile-details';
import { JobHistory } from './_job-history/job-history';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Bell, Briefcase, DollarSign, ArrowRight } from 'lucide-react';
import { KPICard } from '@/components/molecules/KPICard';

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

  // Filtrar: solo mostrar proyectos a partir de junio 2026 (lanzamiento de esta función)
  // para no confundir a los modelos con datos históricos anteriores.
  const CUTOFF_DATE = '2026-06';
  const appliedProjects = allAppliedProjects.filter((p) => {
    const dateStr = p.schedule && p.schedule[0] ? p.schedule[0].date : p.created_at;
    if (!dateStr) return false;
    const yearMonth = dateStr.slice(0, 7); // 'YYYY-MM'
    return yearMonth >= CUTOFF_DATE;
  });

  // 3. Identificar si hay alguna propuesta de trabajo pendiente con plazo para aplicar y que no haya expirado
  const pendingInvitation = appliedProjects.find(
    (p) => 
      (p.model_status === 'pending' || !p.model_status) && 
      p.public_id && 
      p.application_deadline && 
      new Date(p.application_deadline).getTime() > Date.now()
  );

  // 4. Calcular KPIs
  const totalProjects = appliedProjects.length;
  const approvedCount = appliedProjects.filter((p) => p.client_selection === 'approved').length;

  // Ingresos en GTQ: sumamos agreed_fee por días asignados (schedules) o fixed fee
  const totalIncome = appliedProjects
    .filter((p) => p.client_selection === 'approved')
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

      {/* Fila de KPI Widgets */}
      <div className="grid grid-cols-2 gap-4">
        <KPICard
          title="Proyectos"
          value={String(totalProjects)}
          description={`${approvedCount} aprobados`}
          icon={Briefcase}
          iconClassName="text-purple"
          className="bg-[rgb(var(--sys-bg-secondary))] hover:bg-[rgb(var(--sys-bg-secondary))]"
        />
        <KPICard
          title="Ingresos"
          value={`GTQ ${totalIncome.toLocaleString()}`}
          description={`${approvedCount} proyectos pagados`}
          icon={DollarSign}
          iconClassName="text-emerald-500"
          className="bg-[rgb(var(--sys-bg-secondary))] hover:bg-[rgb(var(--sys-bg-secondary))]"
        />
      </div>

      {/* Grid de Perfil e Historial */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-1">
          <ProfileDetails model={model} />
        </div>
        <div className="md:col-span-2">
          <JobHistory projects={appliedProjects} />
        </div>
      </div>

    </div>
  );
}
