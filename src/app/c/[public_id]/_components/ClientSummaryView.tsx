'use client';

import { useTransition } from 'react';
import { Model, Project } from '@/lib/types';
import { reopenProject } from '@/lib/actions/client_actions';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ClientNavbar } from '../../_components/ClientNavbar';
import { ClientFooter } from '../../_components/ClientFooter';
import { Loader2, Pencil } from 'lucide-react';
import Image from 'next/image';

interface SummaryProps {
  project: Project;
  models: Model[];
}

export default function ClientSummaryView({ project, models }: SummaryProps) {
  const [isReopening, startReopenTransition] = useTransition();

  // Solo nos importan los aprobados para esta vista
  const approved = models.filter(m => m.client_selection === 'approved');

  const handleReopen = () => {
    startReopenTransition(async () => {
      const result = await reopenProject(project.id);
      if (result.success) {
        toast.success('Modo edición activado');
      } else {
        toast.error('Error', { description: result.error });
      }
    });
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      <div className="w-full max-w-[1340px] mx-auto px-6 md:px-0 flex flex-col flex-1">
        
        <ClientNavbar clientName={project.client_name} />

        <main className="flex-1 py-12 md:py-20 flex flex-col items-center">
          
          {/* 1. TÍTULO Y TEXTO */}
          <div className="text-center space-y-4 mb-12 max-w-2xl">
            <h1 className="text-heading-40 md:text-heading-48 font-semibold">
              ¡Selección Enviada!
            </h1>
            <p className="text-muted-foreground text-lg">
              {approved.length > 0 
                ? `Elegiste ${approved.length} talento${approved.length === 1 ? '' : 's'} que encajan perfectamente con tu proyecto.`
                : 'No seleccionaste ningún talento en esta revisión.'}
            </p>
          </div>

          {/* 2. GRID DE TALENTO APROBADO */}
          {approved.length > 0 && (
            // CAMBIO REALIZADO: Se eliminó 'max-w-5xl' para permitir el ancho completo del contenedor padre (1340px)
            <div className="w-full mb-16"> 
              <h3 className="text-lg font-medium mb-6 text-center md:text-left">Talento aprobado:</h3>
              
              <div className="client-grid"> 
                {approved.map(model => (
                  <div key={model.id} className="group relative">
                    <div className="aspect-[3/4] relative rounded-md overflow-hidden border bg-muted shadow-sm">
                      {model.coverUrl ? (
                        <Image 
                          src={model.coverUrl} 
                          alt={model.alias || ''} 
                          fill 
                          className="object-cover"
                          // CAMBIO REALIZADO: Sizes actualizados para coincidir con ClientGrid.tsx
                          sizes="(min-width: 1600px) 16.6vw, (min-width: 1200px) 20vw, (min-width: 900px) 25vw, (min-width: 480px) 33vw, 50vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xs">
                          Sin foto
                        </div>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-6">
                        <p className="text-white font-medium truncate text-sm">{model.alias}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. BOTÓN SUTIL (Para no incitar al cambio) */}
          <div>
            <Button 
              variant="outline" 
              onClick={handleReopen} 
              disabled={isReopening}
              className="text-muted-foreground hover:text-foreground border-muted-foreground/30 min-w-[140px]"
            >
              {isReopening ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Pencil className="mr-2 h-3.5 w-3.5" />}
              {isReopening ? 'Cargando...' : 'Editar selección'}
            </Button>
          </div>

        </main>

        <ClientFooter />
      </div>
    </div>
  );
}