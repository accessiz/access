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
  
  // Define la URL y el mensaje para compartir
  const projectUrl = typeof window !== 'undefined' ? `${window.location.origin}/c/${project.id}` : '';
  const shareMessage = `Hola,\n\nTe compartimos el enlace para la selección del casting del proyecto "${project.project_name}".\n\nEnlace: ${projectUrl}\n${project.password ? `Contraseña: ${project.password}\n` : ''}\nPara cualquier consulta, quedamos a disposición.\nIZ Management | IZ ACCESS`;

  /**
   * Función de copiado robusta con fallback para contextos no seguros (http://)
   * Devuelve 'true' si tuvo éxito, 'false' si falló.
   */
  async function copyToClipboardFallback(textToCopy: string): Promise<boolean> {
    // 1. Intenta usar la API moderna (falla en http:// en móvil)
    // Se comprueba explícitamente si el contexto es seguro.
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        return true;
      } catch (err) {
        console.warn('Fallo al copiar con la API moderna:', err);
        // Continúa al fallback si falla (ej. permiso denegado)
      }
    }

    // 2. Fallback a la API antigua (deprecated, pero funciona en http://)
    let textArea: HTMLTextAreaElement | null = null;
    try {
      textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      // Oculta el textarea para que no cause un salto visual
      textArea.style.position = 'fixed';
      textArea.style.top = '-9999px';
      textArea.style.left = '-9999px';
      textArea.style.opacity = '0';
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      // document.execCommand retorna un booleano de éxito/fallo
      const successful = document.execCommand('copy');
      return successful;

    } catch (err) {
      console.error('Fallo al copiar con el método fallback:', err);
      return false;
    } finally {
      // Limpia el DOM en cualquier caso
      if (textArea) {
        document.body.removeChild(textArea);
      }
    }
  }

  // Función para copiar el enlace simple
  const handleCopyLink = async () => {
    const success = await copyToClipboardFallback(projectUrl);
    if (success) {
      toast.success('Enlace copiado.');
    } else {
      toast.error('No se pudo copiar el enlace.');
    }
  };

  // Función para copiar la contraseña simple
  const handleCopyPassword = async () => {
    if (!project.password) return;
    const success = await copyToClipboardFallback(project.password);
    if (success) {
      toast.success('Contraseña copiada.');
    } else {
      toast.error('No se pudo copiar la contraseña.');
    }
  };


  // Función principal: Copia el mensaje completo y actualiza el estado
  const handleShareAndSend = async () => {
    
    // 1. Llama a la nueva función de copiado y espera el resultado
    const success = await copyToClipboardFallback(shareMessage);

    if (!success) {
      toast.error('No se pudo copiar el mensaje.');
      return; // Detiene la ejecución si el copiado falla
    }

    // 2. Si el copiado fue exitoso, continúa con la lógica
    setCopied(true);
    toast.success('¡Mensaje completo copiado!');
    setTimeout(() => setCopied(false), 2000); // Resetea el ícono de check

    // 3. Actualiza el estado del proyecto si está en 'draft'
    if (project.status === 'draft') {
      startTransition(async () => {
        const result = await updateProjectStatus(project.id, 'sent');
        if (result.success) {
          onStatusChange('sent'); // Actualiza el estado en el componente padre
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
              <Button size="icon" variant="outline" onClick={handleCopyLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {project.password && (
            <div className="space-y-2">
              <Label htmlFor="project-password">Contraseña</Label>
              <div className="flex items-center gap-2">
                <Input id="project-password" value={project.password} readOnly />
                 <Button size="icon" variant="outline" onClick={handleCopyPassword}>
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