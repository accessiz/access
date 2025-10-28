import { notFound } from 'next/navigation';
import { getProjectById, getModelForProject } from '@/lib/api/projects';
import PortfolioView from './_components/PortfolioView';

export const dynamic = 'force-dynamic';

// 1. CORRECCIÓN DEL TIPO: 'params' ahora es una Promise que contiene ambos IDs
type PageProps = {
  params: Promise<{ public_id: string; model_id: string }>;
};

export default async function ModelPortfolioPage({ params }: PageProps) {
  // 2. CORRECCIÓN: Usamos 'await' para desestructurar ambos IDs
  const { public_id: projectId, model_id: modelId } = await params;

  // 1. Obtenemos el proyecto PRIMERO usando el public_id (projectId)
  const project = await getProjectById(projectId);

  // Si no se encuentra el proyecto, mostramos un 404
  if (!project) {
    notFound();
  }

  // 2. AHORA usamos el ID real del proyecto (project.id) para buscar el modelo
  //    junto con el modelId.
  const model = await getModelForProject(project.id, modelId);

  // Si no se encuentra el modelo (o no pertenece a ese project.id), mostramos 404
  if (!model) {
    notFound();
  }

  // 3. Pasamos ambos objetos al componente cliente
  return <PortfolioView project={project} model={model} />;
}