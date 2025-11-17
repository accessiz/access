// src/app/c/[public_id]/_components/ClientViewHandler.tsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import { Project, Model } from '@/lib/types';
import { finalizeProjectReview } from '@/lib/actions/client_actions'; 
// 1. Importamos la acción para actualizar el estado
import { updateProjectStatus } from '@/lib/actions/projects'; 
import { toast } from 'sonner';
import PasswordProtect from './PasswordProtect';
import { ClientNavbar } from '../../_components/ClientNavbar';
import { ClientHeader } from '../../_components/ClientHeader';
import { ClientGrid } from '../../_components/ClientGrid';
import { ClientFooter } from '../../_components/ClientFooter';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

// --- INICIO DE LA MODIFICACIÓN ---
// Importamos el hook de autenticación
import { useAuth } from '@/hooks/useAuth'; //
// --- FIN DE LA MODIFICACIÓN ---

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
  
  // Renombramos la transición para ser específica
  const [isFinalizing, startFinalizeTransition] = useTransition();
  
  // Añadimos una nueva transición para la actualización de estado
  const [isUpdatingStatus, startStatusUpdateTransition] = useTransition();

  // --- INICIO DE LA MODIFICACIÓN ---
  // Obtenemos el estado del usuario (logueado o anónimo)
  const { user, loading: authLoading } = useAuth(); //
  // --- FIN DE LA MODIFICACIÓN ---

  // useEffect para cambiar el estado a "in-review"
  useEffect(() => {
    // No hacer nada hasta que sepamos si el usuario está logueado o no
    if (authLoading) {
      return; 
    }

    // Se ejecuta solo si:
    //    - El proyecto está en 'sent'
    //    - No estamos ya actualizándolo
    //    - Y (¡NUEVO!) el usuario es anónimo (user === null)
    if (user === null && project.status === 'sent' && !isUpdatingStatus) {
      
      startStatusUpdateTransition(async () => {
        // ¡Línea activada!
        const result = await updateProjectStatus(project.id, 'in-review'); //
        
        if (!result.success) {
          // Si falla, ahora podemos verlo en la consola
          console.error("Error al actualizar estado a 'in-review':", result.error);
        }
      });
    }
    // Añadimos 'user' y 'authLoading' a las dependencias del useEffect
  }, [project.id, project.status, isUpdatingStatus, user, authLoading]); //

  // useEffect para poblar modelos (sin cambios)
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
    // Usamos la transición correcta
    startFinalizeTransition(async () => {
      const result = await finalizeProjectReview(project.id);
      
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
            <div className="flex-shrink-0">
              {/* Usamos la variable de transición correcta */}
              <Button size="lg" onClick={handleFinalize} disabled={isFinalizing} className="w-full md:w-auto">
                <Send className="mr-2 size-4" />
                {isFinalizing ? 'Enviando...' : 'Finalizar Revisión'}
              </Button>
            </div>
          </div>

          <ClientGrid models={models} projectId={project.public_id} />

          <div className="flex justify-end pt-4 pb-16 md:pb-24">
             {/* Usamos la variable de transición correcta */}
            <Button size="lg" onClick={handleFinalize} disabled={isFinalizing}>
              <Send className="mr-2 size-4" />
              {isFinalizing ? 'Enviando...' : 'Finalizar Revisión'}
            </Button>
          </div>

        </main>

        <ClientFooter />

      </div> {/* Fin del div max-w-7xl */}
    </div>
  );
}