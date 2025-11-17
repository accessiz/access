import { cookies } from 'next/headers';
import { getProjectById, getModelsForProject } from '@/lib/api/projects';
import ClientViewHandler from './_components/ClientViewHandler';
import { CheckCircle2 } from 'lucide-react';

// Importamos los componentes de layout para la página de "Gracias"
import { ClientNavbar } from '../_components/ClientNavbar';
import { ClientFooter } from '../_components/ClientFooter';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ public_id: string }>;
};

export default async function ClientViewPage({ params }: PageProps) {
  const { public_id: publicId } = await params;
  const project = await getProjectById(publicId);

  if (!project) {
    return (
      <div className="flex h-screen w-full items-center justify-center text-center p-4">
        <div>
          <h1 className="text-heading-40 font-bold">Proyecto no encontrado</h1>
          <p className="text-muted-foreground mt-2">El enlace puede ser incorrecto o el proyecto ha sido eliminado.</p>
        </div>
      </div>
    );
  }

  // 2. Comprobación de estado (¡MODIFICADO!)
  if (project.status === 'completed' || project.status === 'archived') {
    return (
      <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
        <div className="w-full max-w-[1340px] mx-auto px-6 md:px-0 flex flex-col flex-1">
          
          <ClientNavbar clientName={project.client_name} />

          {/* --- INICIO DE LA MODIFICACIÓN (Estilo Vercel Card) ---
            
            1. 'main' vuelve a ser el contenedor centrado.
            2. 'py-20' = 80px (múltiplo de 8)
            3. 'px-4' = 16px (múltiplo de 8)
          */}
          <main className="flex-1 flex items-center justify-center py-20 px-4">
            
            {/* Esta es la "cajita" de Vercel
              - usa bg-card (16 16 16 en dark) y border-border (28 28 28 en dark)
              - p-16 = 64px (padding interno generoso, múltiplo de 8)
              - rounded-lg = 8px (un radio sutil como en la imagen)
              - max-w-lg = 512px (múltiplo de 8)
            */}
            <div className="
              bg-card border border-border rounded-lg
              p-16 
              max-w-lg w-full text-center
              animate-fade-in-up
            ">
              
              {/* Icono
                - h-16 w-16 = 64px
                - mb-8 = 32px
              */}
              <CheckCircle2 
                className="
                  mx-auto h-16 w-16 text-green-500 
                  mb-8
                  transform animate-scale-bounce 
                  [animation-delay:0.3s]
                " 
              />
              
              <h1 className="text-heading-48 mb-4">
                ¡Gracias!
              </h1>
              
              <p className="text-copy-16 text-muted-foreground mb-8">
                La selección para este proyecto ya ha sido completada y enviada.
              </p>
              
              <p className="text-muted-foreground">
                Para cualquier consulta, por favor comunícate a 
                <a 
                  href="mailto:info@izmanagementglobal.com" 
                  className="font-semibold text-primary underline ml-1 hover:text-primary/80 transition-colors"
                >
                  info@izmanagementglobal.com
                </a>.
              </p>
            </div>
            
          </main>
          {/* --- FIN DE LA MODIFICACIÓN --- */}

          <ClientFooter />

        </div>
      </div>
    );
  }
  
  // --- Lógica que solo se ejecuta para proyectos ACTIVOS ---
  
  const cookieStore = await cookies();
  const cookieName = `project_access_${project.id}`;
  const hasAccessCookie = cookieStore.get(cookieName)?.value === 'true';

  const models = (!project.password || hasAccessCookie) ? await getModelsForProject(project.id) : [];

  return (
    <ClientViewHandler
      project={project}
      initialModels={models}
      hasAccessCookie={hasAccessCookie}
    />
  );
}