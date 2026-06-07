import { redirect } from 'next/navigation';
import { getProjectById } from '@/lib/api/projects';
import { getLoggedInModel, logModelOpenedLink } from '@/lib/actions/models_portal';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { ApplyForm } from './_apply-form/apply-form';
import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';

type PageProps = {
  params: Promise<{ public_id: string }>;
};

// Generar meta tags dinámicos para WhatsApp / Previsualizaciones
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  await connection();
  const { public_id } = await params;
  const project = await getProjectById(public_id);

  if (!project) {
    return {
      title: 'proyecto no encontrado',
    };
  }

  // Formatear fechas consolidadas
  let datesStr = 'no definidas';
  if (project.schedule && project.schedule.length > 0) {
    const sorted = [...project.schedule].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const first = new Date(`${sorted[0].date}T00:00:00`);
    const last = new Date(`${sorted[sorted.length - 1].date}T00:00:00`);
    if (sorted.length === 1) {
      datesStr = first.toLocaleDateString('es-GT', { day: 'numeric', month: 'long' });
    } else {
      datesStr = `${first.getDate()} de ${first.toLocaleDateString('es-GT', { month: 'short' })} al ${last.getDate()} de ${last.toLocaleDateString('es-GT', { month: 'short' })}`;
    }
  }

  // Formatear pago
  const fee = project.default_model_fee;
  const currency = project.currency || 'GTQ';
  const paymentStr = fee ? `${currency} ${fee} por día` : 'canje';

  return {
    title: `proyecto: ${project.project_name}`,
    description: `fecha: ${datesStr} | pago: ${paymentStr}. confirma tu disponibilidad aquí.`,
    openGraph: {
      title: `proyecto: ${project.project_name}`,
      description: `fecha: ${datesStr} | pago: ${paymentStr}. confirma tu disponibilidad aquí.`,
      type: 'website',
    },
  };
}

export default function ProjectApplyPage({ params }: PageProps) {
  return (
    <div className="w-full max-w-3xl py-6">
      <Suspense fallback={<div className="text-center text-body text-muted-foreground">Cargando propuesta...</div>}>
        <ApplyFormWrapper params={params} />
      </Suspense>
    </div>
  );
}

async function ApplyFormWrapper({ params }: PageProps) {
  const { public_id: publicId } = await params;

  // 1. Verificar sesión del modelo
  const model = await getLoggedInModel();
  if (!model) {
    redirect(`/model/login?redirectTo=/m/${publicId}`);
  }

  // 2. Cargar el proyecto
  const project = await getProjectById(publicId);
  if (!project) {
    return (
      <div className="text-center space-y-2">
        <h1 className="text-display font-semibold text-primary">proyecto no encontrado</h1>
        <p className="text-body text-muted-foreground">el enlace puede ser inválido o el proyecto ya fue eliminado.</p>
      </div>
    );
  }

  // 3. Registrar que el modelo abrió el enlace
  await logModelOpenedLink(project.id, model.id);

  // 4. Obtener estado de postulación actual si existe
  const { data: relation } = await supabaseAdmin
    .from('projects_models')
    .select('*')
    .eq('project_id', project.id)
    .eq('model_id', model.id)
    .maybeSingle();

  // Enriquecer el model con los campos de la relación
  const enrichedModel = {
    ...model,
    model_status: relation?.model_status || null,
    model_available_schedules: relation?.model_available_schedules || null,
  };

  return <ApplyForm project={project} model={enrichedModel} />;
}
