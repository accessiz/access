'use client';

// (Importaciones y lógica de estado sin cambios)
import { useEffect, useState, useTransition } from 'react';
import { Project, Model } from '@/lib/types';
import { updateProjectStatus } from '@/lib/actions/projects';
import { toast } from 'sonner';
import PasswordProtect from './PasswordProtect';
import { ClientNavbar } from '../../_components/ClientNavbar';
import { ClientHeader } from '../../_components/ClientHeader';
import { ClientGrid } from '../../_components/ClientGrid';
import { ClientFooter } from '../../_components/ClientFooter';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

type GridModel = Model & {
    selection?: 'pending' | 'approved' | 'rejected' | null
};

interface HandlerProps {
  project: Project;
  initialModels: Model[];
  hasAccessCookie: boolean;
}

export default function ClientViewHandler({ project, initialModels, hasAccessCookie }: HandlerProps) {

  const [models, setModels] = useState<GridModel[]>(
    initialModels.map(m => ({
      ...m,
      selection: (m.client_selection as GridModel['selection']) ?? 'pending'
    }))
  );
  const [isSubmitting, startTransition] = useTransition();

  useEffect(() => {
    if (project.status === 'sent') {
      updateProjectStatus(project.id, 'in-review');
    }
  }, [project.id, project.status]);

  useEffect(() => {
    if (models.length === 0 && initialModels.length > 0) {
      setModels(
        initialModels.map(m => ({
          ...m,
          selection: (m.client_selection as GridModel['selection']) ?? 'pending'
        }))
      );
    }
  }, [initialModels, models.length]);

  const handleFinalize = () => {
    startTransition(async () => {
      const result = await updateProjectStatus(project.id, 'completed');
      if (result.success) {
        toast.success('¡Revisión enviada!', {
          description: 'Gracias por completar la selección. Hemos notificado a la agencia.'
        });
      } else {
        toast.error('Error al finalizar', {
          description: result.error || 'No se pudo enviar tu revisión. Intenta de nuevo.'
        });
      }
    });
  };

  if (project.password && !hasAccessCookie) {
    return <PasswordProtect projectId={project.id} projectName={project.project_name || 'este proyecto'} />;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-white text-black dark:bg-black dark:text-white">

      {/* Contenedor principal AHORA controla el padding horizontal (px-6 md:px-8) */}
      <div className="w-full max-w-[1340px] mx-auto px-6 md:px-0">

        {/* Navbar (SIN padding horizontal propio) */}
        <ClientNavbar clientName={project.client_name} />

        {/* Bloque "Hero" (SIN padding horizontal propio, solo vertical py-*) */}
        <div className="py-24 sm:py-[220px]">
          <ClientHeader projectName={project.project_name} />
        </div>

        {/* Main (SIN padding horizontal propio, solo vertical space-y-*) */}
        <main className="w-full flex-1 space-y-12">

          {/* Bloque de Instrucción y Acción (SIN padding horizontal propio) */}
          <div className="flex flex-col gap-6 py-8 md:flex-row md:items-center md:justify-between">
            <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
              Revisa el talento disponible para tu proyecto. Haz clic en un perfil para ver su portafolio completo y emitir tu aprobación o rechazo.
            </p>
            <div className="flex-shrink-0">
              <Button size="lg" onClick={handleFinalize} disabled={isSubmitting} className="w-full md:w-auto">
                <Send className="mr-2 size-4" />
                {isSubmitting ? 'Enviando...' : 'Finalizar Revisión'}
              </Button>
            </div>
          </div>

          {/* El Grid (SIN padding horizontal propio) */}
          <ClientGrid models={models} projectId={project.public_id} />

          {/* Botón Inferior (SIN padding horizontal propio, solo vertical pt-* pb-*) */}
          <div className="flex justify-end pt-4 pb-16 md:pb-24">
            <Button size="lg" onClick={handleFinalize} disabled={isSubmitting}>
              <Send className="mr-2 size-4" />
              {isSubmitting ? 'Enviando...' : 'Finalizar Revisión'}
            </Button>
          </div>

        </main>

        {/* Footer (SIN padding horizontal propio, solo vertical py-*) */}
        <ClientFooter />

      </div> {/* Fin del div max-w-7xl */}
    </div>
  );
}