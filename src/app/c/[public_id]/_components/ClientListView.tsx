'use client';

import Link from 'next/link';
import { Model } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Clock, ChevronRight } from 'lucide-react';

// Definimos el tipo localmente para incluir la selección
type GridModel = Model & {
    selection?: 'pending' | 'approved' | 'rejected' | null
};

interface ClientListViewProps {
  models: GridModel[];
  projectId: string;
}

// Helper para mostrar el estado en formato Badge (etiqueta)
function StatusBadge({ status }: { status: GridModel['selection'] }) {
  if (status === 'approved') {
    return <Badge variant="outline" className="border-green-600 text-green-600 bg-green-50 dark:bg-green-900/20 gap-1"><CheckCircle2 className="h-3 w-3" /> Aprobado</Badge>;
  }
  if (status === 'rejected') {
    return <Badge variant="outline" className="border-red-500 text-red-500 bg-red-50 dark:bg-red-900/20 gap-1"><XCircle className="h-3 w-3" /> Descartado</Badge>;
  }
  return <Badge variant="outline" className="text-muted-foreground gap-1"><Clock className="h-3 w-3" /> Pendiente</Badge>;
}

export function ClientListView({ models, projectId }: ClientListViewProps) {
  // Guardar posición de scroll antes de navegar (igual que en Grid)
  const saveScrollPosition = () => {
    sessionStorage.setItem(`client_scroll_${projectId}`, String(window.scrollY));
  };

  if (models.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
        <p className="text-copy-14 text-muted-foreground">No se encontraron talentos con estos filtros.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Foto</TableHead>
            <TableHead>Alias / Nombre</TableHead>
            <TableHead className="hidden sm:table-cell">País</TableHead>
            <TableHead className="hidden sm:table-cell">Estatura</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {models.map((model) => (
            <TableRow 
                key={model.id} 
                className="group cursor-pointer hover:bg-muted/50"
            >
              <TableCell>
                <Avatar className="h-12 w-12 rounded-md">
                  <AvatarImage src={model.coverUrl || undefined} className="object-cover" />
                  <AvatarFallback className="rounded-md">{model.alias?.substring(0, 2) ?? 'IZ'}</AvatarFallback>
                </Avatar>
              </TableCell>
              
              <TableCell className="font-medium">
                 <div className="flex flex-col">
                    <span>{model.alias || 'Sin Alias'}</span>
                    <span className="text-label-12 text-muted-foreground sm:hidden">{model.country}</span>
                 </div>
              </TableCell>
              
              <TableCell className="hidden sm:table-cell">{model.country || '-'}</TableCell>
              
              <TableCell className="hidden sm:table-cell">
                {model.height_cm ? `${model.height_cm} cm` : '-'}
              </TableCell>
              
              <TableCell>
                <StatusBadge status={model.selection} />
              </TableCell>
              
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" asChild onClick={saveScrollPosition}>
                    <Link href={`/c/${projectId}/${model.id}`}>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}