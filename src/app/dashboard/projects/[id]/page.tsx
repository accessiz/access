import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProjectById, getModelsForProject } from '@/lib/api/projects';
import { getModelsEnriched } from '@/lib/api/models'; // Necesario para obtener la lista de 'todos los modelos'
import ProjectDetailClient from './project-detail-client';
// CORRECCIÓN: Se elimina la importación de SUPABASE_PUBLIC_URL (ya no se pasa)
// import { SUPABASE_PUBLIC_URL } from '@/lib/constants';

// Forzamos el renderizado dinámico para esta página
export const dynamic = 'force-dynamic';

type PageProps = {
  // Los params son Promises en versiones recientes si la página es dinámica
  params: Promise<{ id: string }>;
};

export default async function ProjectDetailPage({ params }: PageProps) {
  // Resolvemos la promesa para obtener el ID del proyecto
  const { id } = await params;

  // Creamos el cliente de Supabase para operaciones del lado del servidor
  const supabase = await createClient();

  // Verificamos la autenticación del usuario
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // Redirigimos al login si no está autenticado
    redirect('/login');
  }

  // CORRECCIÓN: Se elimina la variable 'publicUrl' (ya no se pasa)
  // const publicUrl = SUPABASE_PUBLIC_URL;


  // Obtenemos los detalles del proyecto, los modelos ya seleccionados, y todos los modelos disponibles en paralelo
  const [project, selectedModels, { data: allModels }] = await Promise.all([
    getProjectById(id), // Obtiene el proyecto específico por su ID o public_id
    getModelsForProject(id), // Obtiene los modelos vinculados a este proyecto (ahora optimizado)
    getModelsEnriched({ limit: 1000 }) // Obtiene una lista grande de todos los modelos para la UI de selección
  ]);

  // Manejamos el caso en que el proyecto no se encuentre
  if (!project) {
    return (
      <div className="p-8 md:p-12 text-center">
        <h1 className="text-2xl font-bold">Proyecto no encontrado</h1>
        <p className="text-muted-foreground">El proyecto que buscas no existe o no tienes permiso para verlo.</p>
      </div>
    );
  }

  // Renderizamos el componente cliente, pasando todos los datos necesarios
  return (
    <ProjectDetailClient
      project={project} // Los detalles del proyecto actual
      initialSelectedModels={selectedModels} // Los modelos ya asociados a este proyecto
      allModels={allModels} // Todos los modelos disponibles para añadir
      // CORRECCIÓN: Se elimina la prop 'publicStorageUrl={publicUrl}'
    />
  );
}