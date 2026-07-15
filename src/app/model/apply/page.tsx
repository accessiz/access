import { redirect } from 'next/navigation';
import { getLoggedInModel, getAppliedProjectsForModel } from '@/lib/actions/models_portal';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ClientProposalsFeed } from './_feed/client-proposals-feed';

export const metadata: Metadata = {
  title: 'Propuestas De Trabajo — Portal de Modelos',
  description: 'Confirma tu disponibilidad para los proyectos activos.',
};

export default function ModelApplyPage() {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 py-6 text-left">
      <div className="space-y-1">
        <h3 className="ds-text-lg font-extrabold text-[rgb(var(--ds-color-on-surface))]">Propuestas De Trabajo</h3>
        <p className="ds-text-xs text-[rgb(var(--ds-color-on-surface-variant))]/85 leading-relaxed max-w-2xl">
          Aquí tienes tus propuestas de trabajo. Elige si estás disponible o si no puedes ir. Si el cliente te aprueba, el trabajo aparecerá en tu perfil.
        </p>
      </div>
      <Suspense fallback={<div className="text-center ds-text-sm text-[rgb(var(--ds-color-on-surface-variant))]">Cargando propuestas...</div>}>
        <ActiveProposalsContent />
      </Suspense>
    </div>
  );
}

async function ActiveProposalsContent() {
  const model = await getLoggedInModel();
  if (!model) {
    redirect('/model/login?redirectTo=/model/apply');
  }

  const allAppliedProjects = await getAppliedProjectsForModel(model.id);

  // Mapeamos los proyectos filtrándolos para pasarlos al componente del cliente
  const activeProjects = allAppliedProjects.map((p) => ({
    project_id: p.project_id,
    project_name: p.project_name,
    description: p.description || '',
    location: p.location || '',
    currency: p.currency || 'GTQ',
    agreed_fee: p.agreed_fee || 0,
    fee_type: p.fee_type || 'per_day',
    model_status: p.model_status || null,
    apply_end_at: p.apply_end_at || null,
    public_id: p.public_id || '',
    schedule: p.schedule || [],
    gender_target: p.gender_target || 'Todos',
    client_selection: p.client_selection || 'pending'
  }));

  return <ClientProposalsFeed proposals={activeProjects} />;
}
