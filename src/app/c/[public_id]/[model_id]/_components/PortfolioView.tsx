'use client'

import { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { Model, Project } from '@/lib/types';
import { updateModelSelection } from '@/lib/actions/projects_models';

import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, X, Loader2 } from 'lucide-react';

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
        toast.success(`Selección guardada: ${selection === 'approved' ? 'Aprobado' : 'Rechazado'}`);
        // Actualizamos el estado local para reflejar el cambio en la UI
        setModel(prevModel => ({ ...prevModel, client_selection: selection }));
      } else {
        toast.error(result.error || 'No se pudo guardar la selección.');
      }
    });
  };

  const backUrl = `/c/${project.id}`;

  return (
    <div className="relative min-h-screen w-full bg-white text-black flex flex-col">
      {/* Encabezado con botón de regreso y datos */}
      <header className="absolute top-0 left-0 right-0 z-10 p-4 sm:p-8 flex justify-between items-center">
        <div>
           <h1 className="text-xl font-bold">{model.alias}</h1>
           <p className="text-sm text-gray-600">{project.project_name}</p>
        </div>
        <Button variant="outline" asChild className="bg-white/80 backdrop-blur-sm">
          <Link href={backUrl}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Regresar al Slider
          </Link>
        </Button>
      </header>

      {/* Contenido principal con la imagen */}
      <main className="flex-1 flex items-center justify-center p-4 pt-24 pb-32">
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

      {/* Footer con botones de acción (solo si está pendiente) */}
      {model.client_selection === 'pending' && (
        <footer className="absolute bottom-0 left-0 right-0 z-10 p-4 sm:p-8 bg-gradient-to-t from-white via-white to-transparent">
          <div className="max-w-md mx-auto flex justify-center gap-4">
            <Button
              size="lg"
              variant="outline"
              className="w-full bg-white border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
              onClick={() => handleSelection('rejected')}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="animate-spin" /> : <X className="mr-2" />}
              Rechazar
            </Button>
            <Button
              size="lg"
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => handleSelection('approved')}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="animate-spin" /> : <Check className="mr-2" />}
              Aprobar
            </Button>
          </div>
        </footer>
      )}
       {model.client_selection !== 'pending' && (
         <footer className="absolute bottom-0 left-0 right-0 z-10 p-4 sm:p-8 text-center">
             <p className="text-gray-600 bg-gray-100 inline-block px-4 py-2 rounded-full">
                {`Ya has calificado a este talento como: ${model.client_selection === 'approved' ? 'Aprobado' : 'Rechazado'}`}
            </p>
         </footer>
       )}
    </div>
  );
}