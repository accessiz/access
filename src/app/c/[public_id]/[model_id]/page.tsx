import { notFound } from 'next/navigation';
import { getProjectById, getModelForProject } from '@/lib/api/projects';
import PortfolioView from './_components/PortfolioView';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ public_id: string; model_id: string }>;
};

export default async function ModelPortfolioPage({ params }: PageProps) {
  const { public_id: projectId, model_id: modelId } = await params;

  // Obtenemos los datos del proyecto y del modelo específico en paralelo
  const [project, model] = await Promise.all([
    getProjectById(projectId),
    getModelForProject(projectId, modelId)
  ]);

  // Si no se encuentra el proyecto o el modelo, mostramos un 404
  if (!project || !model) {
    notFound();
  }

  return <PortfolioView project={project} model={model} />;
}
