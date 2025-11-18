// src/app/c/[public_id]/_components/ClientViewHandler.tsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import { Project, Model } from '@/lib/types';
import { finalizeProjectReview } from '@/lib/actions/client_actions'; 
import { updateProjectStatus } from '@/lib/actions/projects'; 
import { toast } from 'sonner';
import PasswordProtect from './PasswordProtect';
import { ClientNavbar } from '../../_components/ClientNavbar';
import { ClientHeader } from '../../_components/ClientHeader';
import { ClientGrid } from '../../_components/ClientGrid';
import { ClientFooter } from '../../_components/ClientFooter';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react'; // Loader2 para feedback visual en el botón
import { useAuth } from '@/hooks/useAuth';

// (Se eliminaron las importaciones de AlertDialog)

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
  
  const [isFinalizing, startFinalizeTransition] = useTransition();
  const [isUpdatingStatus, startStatusUpdateTransition] = useTransition();
  const { user, loading: authLoading } = useAuth(); 

  // Lógica automática de "En Revisión" (sin cambios)
  useEffect(() => {
    if (authLoading) return; 
    if (user === null && project.status === 'sent' && !isUpdatingStatus) {
      startStatusUpdateTransition(async () => {
        const result = await updateProjectStatus(project.id, 'in-review'); 
        if (!result.success) console.error("Error auto-updating status:", result.error);
      });
    }
  }, [project.id, project.status, isUpdatingStatus, user, authLoading]);

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

  // --- LÓGICA DE FINALIZACIÓN DIRECTA (CERO FRICCIÓN) ---
  const handleFinalize = () => {
    startFinalizeTransition(async () => {
      // Llamamos a la acción pasando 'true' para limpiar pendientes automáticamente.
      // Sin preguntas, sin modales.
      const result = await finalizeProjectReview(project.id, true);
      
      if (result.success) {
        toast.success('¡Selección enviada!', {
          description: 'Procesando tus resultados...'
        });
        // La página se refrescará automáticamente y mostrará el ClientSummaryView
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
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">

      <div className="w-full max-w-[1340px] mx-auto px-6 md:px-0">

        <ClientNavbar clientName={project.client_name} />

        <div className="py-24 sm:py-56">
          <ClientHeader projectName={project.project_name} />
        </div>

        <main className="w-full flex-1 space-y-12">

          <div className="flex flex-col gap-6 py-8 md:flex-row md:items-center md:justify-between">
            <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
              Revisa el talento disponible para tu proyecto. Haz clic en un perfil para ver su portafolio completo y emitir tu aprobación o rechazo.
            </p>
            
            {/* Botón Superior */}
            <div className="flex-shrink-0">
              <Button size="lg" onClick={handleFinalize} disabled={isFinalizing} className="w-full md:w-auto">
                {isFinalizing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
                {isFinalizing ? 'Enviando...' : 'Finalizar Revisión'}
              </Button>
            </div>
          </div>

          <ClientGrid models={models} projectId={project.public_id} />

          {/* Botón Inferior */}
          <div className="flex justify-end pt-4 pb-16 md:pb-24">
            <Button size="lg" onClick={handleFinalize} disabled={isFinalizing}>
              {isFinalizing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
              {isFinalizing ? 'Enviando...' : 'Finalizar Revisión'}
            </Button>
          </div>

        </main>

        <ClientFooter />

      </div>
    </div>
  );
}