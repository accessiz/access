'use client'

import { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { Model, Project } from '@/lib/types';
import { updateModelSelection } from '@/lib/actions/projects_models';

import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, X, Loader2 } from 'lucide-react';

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
             toast('Talento Descartado', { icon: <X className="h-4 w-4 text-red-500"/> });
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
      
      <div className="w-full max-w-[1340px] mx-auto px-6 md:px-0 flex flex-col flex-1">
        
        <ClientNavbar clientName={project.client_name} />
        
        <header className="py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <Button variant="outline" asChild>
              <Link href={backUrl}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Regresar al Grid
              </Link>
            </Button>
          </div>
          
          <div className="text-left sm:text-right">
            <ModelHeader modelName={model.alias ?? null} />
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center pb-32">
          <div className="relative w-full max-w-4xl aspect-[4/3]">
            {model.portfolioUrl ? (
              <Image
                src={model.portfolioUrl}
                alt={`Portafolio de ${model.alias}`}
                fill
                className="object-contain rounded-lg"
                priority
              />
            ) : (
              <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Imagen de portafolio no disponible</p>
              </div>
            )}
          </div>
        </main>

        {/* 5. FOOTER DE ACCIONES (Lógica Corregida) */}
        {/* Si es editable, mostramos botones SIEMPRE, sin importar si ya votó */}
        {isEditable ? (
          <footer className="sticky bottom-0 z-10 p-4 sm:p-8 bg-gradient-to-t from-background via-background to-transparent">
            <div className="max-w-md mx-auto flex justify-center gap-4">
              
              {/* Botón RECHAZAR */}
              <Button
                size="lg"
                variant={model.client_selection === 'rejected' ? 'default' : 'outline'} // Visualmente activo si ya estaba rechazado
                className={cn(
                    "w-full",
                    model.client_selection === 'rejected' 
                        ? "bg-red-600 hover:bg-red-700 text-white" 
                        : "bg-background border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
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
                        ? "bg-green-600 hover:bg-green-700"
                        : "border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
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
                <p className="text-center text-xs text-muted-foreground mt-2 animate-in fade-in">
                    Puedes cambiar tu selección pulsando el otro botón.
                </p>
            )}
          </footer>
        ) : (
           /* 6. MODO SOLO LECTURA (Solo si está completado/archivado) */
           <footer className="sticky bottom-0 z-10 p-4 sm:p-8 text-center">
               <p className="text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 inline-block px-4 py-2 rounded-full border">
                  Estado final: <strong>{model.client_selection === 'approved' ? 'Aprobado' : 'Rechazado'}</strong>
              </p>
           </footer>
         )}
         
        <ClientFooter />
        
      </div>
    </div>
  );
}