'use client'

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Model, Project } from '@/lib/types';
import { updateModelSelection } from '@/lib/actions/projects_models';

import { ArrowLeft, Check, X, Loader2 } from 'lucide-react';
import { BackButton } from '@/components/molecules/BackButton';
import { Button } from '@/components/ui/button';

import { ClientNavbar } from '../../../_components/ClientNavbar';
import { ClientFooter } from '../../../_components/ClientFooter';
import { ModelHeader } from '../../../_components/ModelHeader';
import { cn } from '@/lib/utils';

interface PortfolioViewProps {
  project: Project;
  model: Model;
}

export default function PortfolioView({ project, model: initialModel }: PortfolioViewProps) {
  const [model, setModel] = useState(initialModel);
  const [isPending, startTransition] = useTransition();

  const handleSelection = (selection: 'approved' | 'rejected') => {
    startTransition(async () => {
      const result = await updateModelSelection(project.id, model.id, selection);
      if (result.success) {
        // Feedback visual diferente según la acción
        if (selection === 'approved') {
             toast.success('Talento Aprobado');
        } else {
             toast('Talento Descartado', { icon: <X className="h-4 w-4 text-destructive"/> });
        }
        setModel(prevModel => ({ ...prevModel, client_selection: selection }));
      } else {
        toast.error(result.error || 'No se pudo guardar la selección.');
      }
    });
  };

  const backUrl = `/c/${project.public_id}`;
  
  // Determinamos si el proyecto es editable
  const isEditable = project.status === 'in-review' || project.status === 'sent';

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground flex flex-col">
      
      <div className="w-full max-w-335 mx-auto px-6 md:px-0 flex flex-col flex-1">
        
        <ClientNavbar clientName={project.client_name} />
        
        <header className="py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <BackButton
              href={backUrl}
              label="Regresar al Grid"
              text="Regresar al Grid"
              icon={<ArrowLeft className="mr-2 h-4 w-4" />}
              iconOnly={false}
            />
          </div>
          
          <div className="text-left sm:text-right">
            <ModelHeader modelName={model.alias ?? null} />
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center pb-32">
          <div className="relative w-full max-w-4xl aspect-4/3">
            {model.portfolioUrl ? (
              <img
                src={model.portfolioUrl}
                alt={`Portafolio de ${model.alias}`}
                className="absolute inset-0 h-full w-full rounded-lg object-contain"
                loading="eager"
                decoding="async"
              />
            ) : (
              <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Imagen de portafolio no disponible</p>
              </div>
            )}
          </div>
        </main>

        {/* 5. FOOTER DE ACCIONES (Lógica Corregida) */}
        {/* Si es editable, mostramos botones SIEMPRE, sin importar si ya votó */}
        {isEditable ? (
          <footer className="sticky bottom-0 z-10 p-4 sm:p-8 bg-linear-to-t from-background via-background to-transparent">
            <div className="max-w-md mx-auto flex justify-center gap-4">
              
              {/* Botón RECHAZAR */}
              <Button
                size="lg"
                variant={model.client_selection === 'rejected' ? 'default' : 'outline'} // Visualmente activo si ya estaba rechazado
                className={cn(
                    "w-full",
                    model.client_selection === 'rejected' 
                        ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" 
                        : "bg-background border-destructive text-destructive hover:bg-destructive/10"
                )}
                onClick={() => handleSelection('rejected')}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <X className="mr-2 h-4 w-4" />}
                {model.client_selection === 'rejected' ? 'Descartado' : 'Rechazar'}
              </Button>

              {/* Botón APROBAR */}
              <Button
                size="lg"
                variant={model.client_selection === 'approved' ? 'default' : 'outline'} // Visualmente activo si ya estaba aprobado
                className={cn(
                    "w-full",
                    model.client_selection === 'approved'
                        ? "bg-success hover:bg-success/90 text-success-foreground"
                        : "border-success text-success hover:bg-success/10"
                )}
                onClick={() => handleSelection('approved')}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Check className="mr-2 h-4 w-4" />}
                {model.client_selection === 'approved' ? 'Aprobado' : 'Aprobar'}
              </Button>

            </div>
            {/* Pequeño texto de ayuda si ya votó */}
            {model.client_selection && model.client_selection !== 'pending' && (
                <p className="text-center text-label text-muted-foreground mt-2 animate-in fade-in">
                    Puedes cambiar tu selección pulsando el otro botón.
                </p>
            )}
          </footer>
        ) : (
           /* 6. MODO SOLO LECTURA (Solo si está completado/archivado) */
           <footer className="sticky bottom-0 z-10 p-4 sm:p-8 text-center">
               <p className="text-muted-foreground bg-muted inline-block px-4 py-2 rounded-full border border-border">
                  Estado final: <strong>{model.client_selection === 'approved' ? 'Aprobado' : 'Rechazado'}</strong>
              </p>
           </footer>
         )}
         
        <ClientFooter />
        
      </div>
    </div>
  );
}