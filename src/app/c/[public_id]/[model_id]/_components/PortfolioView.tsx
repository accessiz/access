'use client'

import { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { Model, Project } from '@/lib/types';
import { updateModelSelection } from '@/lib/actions/projects_models';

import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, X, Loader2 } from 'lucide-react';

// 1. IMPORTAR LOS COMPONENTES DE LAYOUT
import { ClientNavbar } from '../../../_components/ClientNavbar';
import { ClientFooter } from '../../../_components/ClientFooter';
// 2. IMPORTAR TU NUEVO MODELHEADER
import { ModelHeader } from '../../../_components/ModelHeader';

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
        setModel(prevModel => ({ ...prevModel, client_selection: selection }));
      } else {
        toast.error(result.error || 'No se pudo guardar la selección.');
      }
    });
  };

  const backUrl = `/c/${project.public_id}`; // Usamos public_id para el link

  return (
    <div className="relative min-h-screen w-full bg-white text-black dark:bg-black dark:text-white flex flex-col">
      
      {/* Contenedor principal con MAX-WIDTH Y PADDING */}
      <div className="w-full max-w-[1340px] mx-auto px-6 md:px-0 flex flex-col flex-1">
        
        {/* Navbar (consistente) */}
        <ClientNavbar clientName={project.client_name} />
        
        {/* 3. HEADER ACTUALIZADO USANDO TU COMPONENTE */}
        <header className="py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          {/* Botón de Regreso (bien posicionado) */}
          <div>
            <Button variant="outline" asChild>
              <Link href={backUrl}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Regresar al Grid
              </Link>
            </Button>
          </div>
          
          {/* Contenedor de alineación para tu componente */}
          <div className="text-left sm:text-right">
            {/* Se utiliza tu nuevo componente ModelHeader */}
            <ModelHeader modelName={model.alias ?? null} />
          </div>
        </header>

        {/* 4. Contenido principal con la imagen (sin cambios) */}
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

        {/* 5. Footer de Acciones (sin cambios) */}
        {model.client_selection === 'pending' && (
          <footer className="sticky bottom-0 z-10 p-4 sm:p-8 bg-gradient-to-t from-white via-white to-transparent dark:from-black dark:via-black">
            <div className="max-w-md mx-auto flex justify-center gap-4">
              <Button
                size="lg"
                variant="outline"
                className="w-full bg-white dark:bg-black border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
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
        
        {/* 6. Footer de Estado (sin cambios) */}
        {model.client_selection !== 'pending' && (
           <footer className="sticky bottom-0 z-10 p-4 sm:p-8 text-center">
               <p className="text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 inline-block px-4 py-2 rounded-full">
                  {`Ya has calificado a este talento como: ${model.client_selection === 'approved' ? 'Aprobado' : 'Rechazado'}`}
              </p>
           </footer>
         )}
         
        {/* 7. Footer de Créditos (sin cambios) */}
        <ClientFooter />
        
      </div> {/* Fin del div max-w */}
    </div>
  );
}