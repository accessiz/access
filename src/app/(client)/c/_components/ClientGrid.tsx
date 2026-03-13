'use client'

import { useState } from 'react';
import { Model } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { updateClientModelSelection } from '@/lib/actions/client_actions';
import { toast } from 'sonner';
import { ClientTalentCard } from './ClientTalentCard';

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
  viewMode?: 'grid' | 'single'; // Optional: 'single' shows 1 column on mobile
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

  const handleClick = async (
    e: React.MouseEvent,
    next: 'approved' | 'rejected'
  ) => {
    e.preventDefault();
    e.stopPropagation();

    // Toggle logic: If same selection, set to 'pending' (deselect)
    const finalSelection: GridModel['selection'] = localSelection === next ? 'pending' : next;

    // Optimistic update
    onSelectionChange?.(model.id, finalSelection);
    setIsUpdating(true);

    const result = await updateClientModelSelection(
      realProjectId,
      model.id,
      finalSelection || 'pending'
    );

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
        <div className="flex size-10 items-center justify-center rounded-full bg-white/5 backdrop-blur-md">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full items-center justify-between gap-3">
      <button
        onClick={(e) => handleClick(e, 'approved')}
        className={cn(
          'group inline-flex items-center justify-center rounded-full transition-all duration-300',
          'size-10 md:size-9 border',
          localSelection === 'approved'
            ? 'bg-success/20 border-success text-success'
            : 'bg-white/5 border-white/10 text-muted-foreground backdrop-blur-md hover:bg-success/20 hover:border-success/50 hover:text-success'
        )}
        aria-label="Aprobar"
      >
        <CheckCircle2 className="size-5 transition-transform duration-300" />
      </button>
      <button
        onClick={(e) => handleClick(e, 'rejected')}
        className={cn(
          'group inline-flex items-center justify-center rounded-full transition-all duration-300',
          'size-10 md:size-9 border',
          localSelection === 'rejected'
            ? 'bg-destructive/20 border-destructive text-destructive'
            : 'bg-white/5 border-white/10 text-muted-foreground backdrop-blur-md hover:bg-destructive/20 hover:border-destructive/50 hover:text-destructive'
        )}
        aria-label="Rechazar"
      >
        <XCircle className="size-5 transition-transform duration-300" />
      </button>
    </div>
  );
}

// --- Componente ClientGrid ---
export function ClientGrid({ models, projectId, realProjectId, onSelectionChange, viewMode = 'grid' }: ClientGridProps) {
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

  // Grid class based on viewMode
  const gridClassName = viewMode === 'single' ? 'client-grid-single' : 'client-grid';

  // Renderizado del grid
  return (
    <div className={gridClassName}>
      {models.map((model) => {
        const currentSelection = localSelections[model.id] || model.selection || 'pending';

        return (
          <ClientTalentCard
            key={model.id}
            title={model.alias || 'Sin Alias'}
            modelId={model.id}
            coverUrl={model.coverUrl}
            imageHref={`/c/${projectId}/${model.id}`}
            onImageClick={saveScrollPosition}
            showMobilePeekIcon
            className={cn(
              'transition-all duration-300',
              currentSelection === 'rejected' && 'opacity-50'
            )}
          >
            <QuickApprovalButtons
              model={model}
              realProjectId={realProjectId}
              onSelectionChange={handleLocalSelectionChange}
              localSelection={currentSelection}
            />
          </ClientTalentCard>
        );
      })}
    </div>
  );
}