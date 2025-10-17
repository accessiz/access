'use client'

import { useTransition, useState } from 'react';
import { toast } from 'sonner';
import { Project } from '@/lib/types';
import { updateProjectStatus } from '@/lib/actions/projects';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check } from 'lucide-react';

interface ShareProjectDialogProps {
  project: Project;
  children: React.ReactNode;
  onStatusChange: (newStatus: Project['status']) => void;
}

export function ShareProjectDialog({ project, children, onStatusChange }: ShareProjectDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  
  const projectUrl = typeof window !== 'undefined' ? `${window.location.origin}/c/${project.id}` : '';
  
  // ✅ INICIO DE LA ACTUALIZACIÓN: Nuevo formato de mensaje
  const shareMessage = `Hola,\n\nTe compartimos el enlace para la selección del casting del proyecto "${project.project_name}".\n\nEnlace: ${projectUrl}\n${project.password ? `Contraseña: ${project.password}\n` : ''}\nPara cualquier consulta, quedamos a disposición.\nIZ Management | IZ ACCESS`;
  // ✅ FIN DE LA ACTUALIZACIÓN

  const handleCopy = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
  };

  const handleShareAndSend = () => {
    handleCopy(shareMessage);
    setCopied(true);
    toast.success('¡Mensaje completo copiado!');
    setTimeout(() => setCopied(false), 2000);

    if (project.status === 'draft') {
      startTransition(async () => {
        const result = await updateProjectStatus(project.id, 'sent');
        if (result.success) {
          onStatusChange('sent');
          toast.info('El estado del proyecto se actualizó a "Enviado".');
        } else {
          toast.error('No se pudo actualizar el estado del proyecto.');
        }
      });
    }
  };

  return (
    <Dialog onOpenChange={(open) => !open && setCopied(false)}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Compartir Proyecto</DialogTitle>
          <DialogDescription>
            Copia el enlace y la contraseña para enviárselo a tu cliente.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="project-link">Enlace del Cliente</Label>
            <div className="flex items-center gap-2">
              <Input id="project-link" value={projectUrl} readOnly />
              <Button size="icon" variant="outline" onClick={() => { handleCopy(projectUrl); toast.success('Enlace copiado.'); }}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {project.password && (
            <div className="space-y-2">
              <Label htmlFor="project-password">Contraseña</Label>
              <div className="flex items-center gap-2">
                <Input id="project-password" value={project.password} readOnly />
                 <Button size="icon" variant="outline" onClick={() => { handleCopy(project.password!); toast.success('Contraseña copiada.'); }}>
                    <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="sm:justify-between gap-2">
          <DialogClose asChild><Button type="button" variant="secondary">Cerrar</Button></DialogClose>
          <Button onClick={handleShareAndSend} disabled={isPending}>
            {copied ? <Check className="mr-2" /> : <Copy className="mr-2" />}
            {isPending ? 'Actualizando...' : 'Copiar Mensaje Completo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}