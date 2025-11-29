'use client'

import Link from 'next/link';
import Image from 'next/image';
import { Model } from '@/lib/types'; // Importa el tipo Model
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

// Define el tipo GridModel extendiendo Model
type GridModel = Model & {
    selection?: 'pending' | 'approved' | 'rejected' | null
};

// Define las props que espera ClientGrid
interface ClientGridProps {
  models: GridModel[];
  projectId: string; // Necesita el public_id para construir los links
}

// Componente para el indicador de estado (Helper interno)
function StatusIndicator({ status }: { status: GridModel['selection'] }) {
  if (status === 'approved') {
    return (
      <div className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-green-600 text-white shadow-md">
        <CheckCircle2 className="size-4" />
      </div>
    );
  }
  if (status === 'rejected') {
    return (
      <div className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-red-600 text-white shadow-md">
        <XCircle className="size-4" />
      </div>
    );
  }
  // Pendiente o null
  return (
    <div className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-gray-400/80 text-white backdrop-blur-sm shadow-md">
      <Clock className="size-4" />
    </div>
  );
}

// --- Componente ClientGrid ---
export function ClientGrid({ models, projectId }: ClientGridProps) {
  // Manejo si no hay modelos
  if (models.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground">No hay talentos asignados a este proyecto.</p>
      </div>
    );
  }

  // 🔄 FUNCIÓN ACTUALIZADA: Guarda la posición de scroll antes de navegar.
  const saveScrollPosition = () => {
    // Usamos el public_id para que el scroll sea específico de este proyecto
    sessionStorage.setItem(`client_scroll_${projectId}`, String(window.scrollY));
  };

  // Renderizado del grid
  return (
    // Usa la clase CSS definida en globals.css
    <div className="client-grid">
      {models.map((model) => (
        // Link a la página de detalle del modelo
        <Link
          key={model.id}
          href={`/c/${projectId}/${model.id}`} // Construye el link correctamente
          className={cn(
            "group relative transition-opacity duration-300",
            // Atenúa los ya calificados, pero permite hover
            model.selection !== 'pending' && model.selection !== null && 'opacity-60 hover:opacity-100'
          )}
          // 🔄 AÑADIDO: Guardar la posición antes de navegar
          onClick={saveScrollPosition}
        >
          {/* Contenedor de la Imagen (bordes cuadrados) */}
          <div className="relative aspect-[3/4] bg-muted overflow-hidden"> {/* Añadido overflow-hidden */}
            {model.coverUrl ? (
              <Image
                src={model.coverUrl}
                alt={model.alias || 'Modelo'}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                // Tamaños optimizados para diferentes breakpoints
                sizes="(min-width: 1600px) 16.6vw, (min-width: 1200px) 20vw, (min-width: 900px) 25vw, (min-width: 480px) 33vw, 50vw"
              />
            ) : (
              // Placeholder si no hay imagen
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-copy-14 text-muted-foreground">Sin foto</span>
              </div>
            )}

            {/* Indicador de estado sobre la imagen */}
            <StatusIndicator status={model.selection} />
          </div>

          {/* Nombre del modelo debajo, alineado a la izquierda */}
          <div className="mt-3 text-left"> {/* mt-3 = 12px */}
            <h3 className="text-label-14 text-foreground truncate">{model.alias || 'Sin Alias'}</h3> {/* Añadido truncate */}
          </div>

        </Link>
      ))}
    </div>
  );
}