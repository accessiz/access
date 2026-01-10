'use client'

import { useState } from 'react';
import Link from 'next/link';
import { Model } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import { updateClientModelSelection } from '@/lib/actions/client_actions';
import { toast } from 'sonner';

// Define el tipo GridModel extendiendo Model
type GridModel = Model & {
  selection?: 'pending' | 'approved' | 'rejected' | null
};

// Define las props que espera ClientGrid
interface ClientGridProps {
  models: GridModel[];
  projectId: string; // Necesita el public_id para construir los links
  realProjectId: string; // UUID real del proyecto para server actions
  onSelectionChange?: (modelId: string, selection: GridModel['selection']) => void;
}

// Componente para el indicador de estado (Helper interno)
function StatusIndicator({ status }: { status: GridModel['selection'] }) {
  if (status === 'approved') {
    return (
      <div className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-success text-success-foreground shadow-md">
        <CheckCircle2 className="size-4" />
      </div>
    );
  }
  if (status === 'rejected') {
    return (
      <div className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-md">
        <XCircle className="size-4" />
      </div>
    );
  }
  // Pendiente o null
  return (
    <div className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-muted/80 text-muted-foreground backdrop-blur-sm shadow-md ring-1 ring-border">
      <Clock className="size-4" />
    </div>
  );
}

// Componente de botones de aprobación rápida
function QuickApprovalButtons({
  model,
  realProjectId,
  onSelectionChange,
  localSelection
}: {
  model: GridModel;
  realProjectId: string;
  onSelectionChange?: (modelId: string, selection: GridModel['selection']) => void;
  localSelection: GridModel['selection'];
}) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleClick = async (e: React.MouseEvent, newSelection: 'approved' | 'rejected') => {
    e.preventDefault();
    e.stopPropagation();

    // Toggle: si ya está en ese estado, volver a pending
    const finalSelection: GridModel['selection'] = localSelection === newSelection ? 'pending' : newSelection;

    // Optimistic update
    onSelectionChange?.(model.id, finalSelection);
    setIsUpdating(true);

    const result = await updateClientModelSelection(realProjectId, model.id, finalSelection || 'pending');

    if (!result.success) {
      // Revertir si falla
      onSelectionChange?.(model.id, localSelection);
      toast.error('Error al guardar');
    }

    setIsUpdating(false);
  };

  if (isUpdating) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={(e) => handleClick(e, 'approved')}
        className={cn(
          "flex items-center justify-center size-7 rounded-full transition-all",
          localSelection === 'approved'
            ? "text-success"
            : "text-muted-foreground hover:text-success"
        )}
        aria-label="Aprobar"
      >
        <CheckCircle2 className="size-5" />
      </button>
      <button
        onClick={(e) => handleClick(e, 'rejected')}
        className={cn(
          "flex items-center justify-center size-7 rounded-full transition-all",
          localSelection === 'rejected'
            ? "text-destructive"
            : "text-muted-foreground hover:text-destructive"
        )}
        aria-label="Rechazar"
      >
        <XCircle className="size-5" />
      </button>
    </div>
  );
}

// --- Componente ClientGrid ---
export function ClientGrid({ models, projectId, realProjectId, onSelectionChange }: ClientGridProps) {
  // Estado local para selecciones (para feedback optimista)
  const [localSelections, setLocalSelections] = useState<Record<string, GridModel['selection']>>(() => {
    const initial: Record<string, GridModel['selection']> = {};
    models.forEach(m => {
      initial[m.id] = m.selection || 'pending';
    });
    return initial;
  });

  const handleLocalSelectionChange = (modelId: string, selection: GridModel['selection']) => {
    setLocalSelections(prev => ({ ...prev, [modelId]: selection }));
    onSelectionChange?.(modelId, selection);
  };

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
    sessionStorage.setItem(`client_scroll_${projectId}`, String(window.scrollY));
  };

  // Renderizado del grid
  return (
    <div className="client-grid">
      {models.map((model) => {
        const currentSelection = localSelections[model.id] || model.selection || 'pending';

        return (
          <div
            key={model.id}
            className={cn(
              "group relative transition-all duration-300",
              currentSelection === 'approved' && 'ring-2 ring-success ring-offset-2 rounded-sm',
              currentSelection === 'rejected' && 'opacity-50'
            )}
          >
            {/* Link a la página de detalle del modelo */}
            <Link
              href={`/c/${projectId}/${model.id}`}
              className="block"
              onClick={saveScrollPosition}
            >
              {/* Contenedor de la Imagen */}
              <div className="relative aspect-[3/4] bg-muted overflow-hidden">
                {model.coverUrl ? (
                  <img
                    src={model.coverUrl}
                    alt={model.alias || 'Modelo'}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="text-body text-muted-foreground">Sin foto</span>
                  </div>
                )}

                {/* Indicador de estado */}
                <StatusIndicator status={currentSelection} />
              </div>
            </Link>

            {/* Nombre del modelo y botones de aprobación */}
            <div className="mt-2 flex items-center justify-between gap-2">
              <h3 className="text-body text-foreground truncate flex-1">{model.alias || 'Sin Alias'}</h3>
              <QuickApprovalButtons
                model={model}
                realProjectId={realProjectId}
                onSelectionChange={handleLocalSelectionChange}
                localSelection={currentSelection}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}