'use client';

import Link from 'next/link';
import { Model } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { updateClientModelSelection } from '@/lib/actions/client_actions';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

// Definimos el tipo localmente para incluir la selección
type GridModel = Model & {
  selection?: 'pending' | 'approved' | 'rejected' | null
};

interface ClientListViewProps {
  models: GridModel[];
  projectId: string;
  realProjectId: string;
  onSelectionChange?: (modelId: string, selection: GridModel['selection']) => void;
}

function SelectionIconButtons({
  modelId,
  realProjectId,
  selection,
  onSelectionChange,
}: {
  modelId: string;
  realProjectId: string;
  selection: GridModel['selection'];
  onSelectionChange?: (modelId: string, selection: GridModel['selection']) => void;
}) {
  const [isUpdating, setIsUpdating] = useState(false);

  const setSelection = async (
    e: React.MouseEvent,
    next: 'approved' | 'rejected'
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (isUpdating) return;
    if (selection === next) return;

    const previous = selection;
    onSelectionChange?.(modelId, next);
    setIsUpdating(true);

    const result = await updateClientModelSelection(realProjectId, modelId, next);

    if (!result.success) {
      onSelectionChange?.(modelId, previous);
      toast.error('Error al guardar');
    }

    setIsUpdating(false);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={isUpdating}
        onClick={(e) => setSelection(e, 'approved')}
        className={cn(
          'inline-flex items-center justify-center rounded-full transition-colors',
          'size-9',
          selection === 'approved'
            ? 'bg-success text-success-foreground'
            : 'bg-muted text-muted-foreground hover:bg-success hover:text-success-foreground',
          isUpdating && 'opacity-70'
        )}
        aria-label="Aprobar"
      >
        {isUpdating ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-5" />}
      </button>
      <button
        type="button"
        disabled={isUpdating}
        onClick={(e) => setSelection(e, 'rejected')}
        className={cn(
          'inline-flex items-center justify-center rounded-full transition-colors',
          'size-9',
          selection === 'rejected'
            ? 'bg-destructive text-destructive-foreground'
            : 'bg-muted text-muted-foreground hover:bg-destructive hover:text-destructive-foreground',
          isUpdating && 'opacity-70'
        )}
        aria-label="Rechazar"
      >
        {isUpdating ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-5" />}
      </button>
    </div>
  );
}

export function ClientListView({ models, projectId, realProjectId, onSelectionChange }: ClientListViewProps) {
  // Guardar posición de scroll antes de navegar (igual que en Grid)
  const saveScrollPosition = () => {
    sessionStorage.setItem(`client_scroll_${projectId}`, String(window.scrollY));
  };

  const [localSelections, setLocalSelections] = useState<Record<string, GridModel['selection']>>(() => {
    const initial: Record<string, GridModel['selection']> = {};
    models.forEach(m => {
      initial[m.id] = m.selection || 'pending';
    });
    return initial;
  });

  useEffect(() => {
    setLocalSelections(prev => {
      const next = { ...prev };
      for (const m of models) {
        if (next[m.id] == null) next[m.id] = m.selection || 'pending';
      }
      return next;
    });
  }, [models]);

  const handleLocalSelectionChange = (modelId: string, selection: GridModel['selection']) => {
    setLocalSelections(prev => ({ ...prev, [modelId]: selection }));
    onSelectionChange?.(modelId, selection);
  };

  if (models.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
        <p className="text-body text-muted-foreground">No se encontraron talentos con estos filtros.</p>
      </div>
    );
  }

  return (
    <div className="sm:rounded-md sm:border">
      {/* Mobile (no horizontal scroll): stacked rows */}
      <div className="sm:hidden">
        <div className="space-y-2 p-2">
          {models.map((model) => {
            const currentSelection = localSelections[model.id] || model.selection || 'pending';
            return (
              <Link
                key={model.id}
                href={`/c/${projectId}/${model.id}`}
                onClick={saveScrollPosition}
                className="flex items-center gap-3 rounded-lg border bg-card p-3 text-card-foreground hover:bg-muted/50"
              >
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarImage src={model.coverUrl || undefined} className="object-cover" />
                  <AvatarFallback>{model.alias?.substring(0, 2) ?? 'IZ'}</AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 truncate font-medium">{model.alias || 'Sin Alias'}</div>

                    <SelectionIconButtons
                      modelId={model.id}
                      realProjectId={realProjectId}
                      selection={currentSelection}
                      onSelectionChange={handleLocalSelectionChange}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Desktop/tablet */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Foto</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {models.map((model) => {
              const currentSelection = localSelections[model.id] || model.selection || 'pending';
              return (
                <TableRow key={model.id} className="group cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={model.coverUrl || undefined} className="object-cover" />
                      <AvatarFallback>{model.alias?.substring(0, 2) ?? 'IZ'}</AvatarFallback>
                    </Avatar>
                  </TableCell>

                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{model.alias || 'Sin Alias'}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <SelectionIconButtons
                      modelId={model.id}
                      realProjectId={realProjectId}
                      selection={currentSelection}
                      onSelectionChange={handleLocalSelectionChange}
                    />
                  </TableCell>

                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild onClick={saveScrollPosition}>
                      <Link href={`/c/${projectId}/${model.id}`}>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}