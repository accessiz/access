'use client'

import { useTransition, useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Project, Model } from '@/lib/types';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SUPABASE_PUBLIC_URL } from '@/lib/constants';
import { Copy, Check, X, AlertTriangle, Calendar } from 'lucide-react';

interface ShareProjectDialogProps {
  project: Project;
  children: React.ReactNode;
  onStatusChange: (newStatus: Project['status']) => void;
  selectedModels?: Model[];
}

export function ShareProjectDialog({ project, children, onStatusChange, selectedModels = [] }: ShareProjectDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [mainDialogOpen, setMainDialogOpen] = useState(false);

  // Define la URL y el mensaje para compartir
  const projectUrl = typeof window !== 'undefined' ? `${window.location.origin}/c/${project.id}` : '';
  const shareMessage = `Hola,\n\nTe compartimos el enlace para la selección del casting del proyecto "${project.project_name}".\n\nEnlace: ${projectUrl}\n${project.password ? `Contraseña: ${project.password}\n` : ''}\nPara cualquier consulta, quedamos a disposición.\nIZ Management | IZ ACCESS`;

  // Calcular modelos sin fechas asignadas
  const modelsWithoutSchedule = useMemo(() => {
    return selectedModels.filter(model => !model.assignments || model.assignments.length === 0);
  }, [selectedModels]);

  const allModelsWithoutSchedule = modelsWithoutSchedule.length === selectedModels.length && selectedModels.length > 0;

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

  // Función que ejecuta el copiado y cambio de estado
  const executeShareAndSend = async () => {
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

    // Cerrar diálogos
    setShowWarning(false);
    setMainDialogOpen(false);
  };

  // Función principal: Verifica si hay modelos sin fechas antes de copiar
  const handleShareAndSend = async () => {
    // Solo mostrar advertencia si: es draft Y hay modelos sin fechas asignadas
    if (project.status === 'draft' && modelsWithoutSchedule.length > 0) {
      setShowWarning(true);
      return;
    }

    // Si no hay advertencia, ejecutar directamente
    await executeShareAndSend();
  };

  return (
    <>
      <Dialog open={mainDialogOpen} onOpenChange={(open) => { setMainDialogOpen(open); if (!open) setCopied(false); }}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent showClose={false} className="w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:w-full sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <DialogTitle>Compartir Proyecto</DialogTitle>
              <DialogClose asChild>
                <Button type="button" variant="ghost" size="icon" className="shrink-0">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Cerrar</span>
                </Button>
              </DialogClose>
            </div>
            <DialogDescription>
              Copia el enlace y la contraseña para enviárselo a tu cliente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-link">Enlace del Cliente</Label>
              <div className="flex items-center gap-2">
                <Input id="project-link" value={projectUrl} readOnly className="w-0 flex-1 min-w-0" />
                <Button size="icon" variant="outline" onClick={handleCopyLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {project.password && (
              <div className="space-y-2">
                <Label htmlFor="project-password">Contraseña</Label>
                <div className="flex items-center gap-2">
                  <Input id="project-password" value={project.password} readOnly className="w-0 flex-1 min-w-0" />
                  <Button size="icon" variant="outline" onClick={handleCopyPassword}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="sm:justify-between gap-2">
            <DialogClose asChild><Button type="button" variant="outline" style={{ borderColor: 'rgb(var(--separator))' }}>Cerrar</Button></DialogClose>
            <Button onClick={handleShareAndSend} disabled={isPending}>
              {copied ? <Check className="mr-2" /> : <Copy className="mr-2" />}
              {isPending ? 'Actualizando...' : 'Copiar Mensaje Completo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warning Dialog - Models without schedule */}
      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent showClose={false} className="w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:w-full sm:max-w-md p-0 gap-0">
          {/* Header con icono de advertencia */}
          <DialogHeader className="p-6 pb-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-warning/20 border border-warning flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-warning" />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-display font-semibold text-foreground">
                Modelos sin Fecha Asignada
              </DialogTitle>
              <DialogDescription className="text-body text-muted-foreground">
                {allModelsWithoutSchedule
                  ? 'Ningún modelo tiene fechas de trabajo asignadas. El cliente no podrá ver cuándo trabajarán.'
                  : `${modelsWithoutSchedule.length} modelo${modelsWithoutSchedule.length !== 1 ? 's' : ''} no tienen fecha de trabajo asignada.`
                }
              </DialogDescription>
            </div>
          </DialogHeader>

          {/* Lista de modelos sin fecha */}
          {!allModelsWithoutSchedule && modelsWithoutSchedule.length > 0 && (
            <div className="px-6 pb-4">
              <ScrollArea className="max-h-48">
                <div className="space-y-2">
                  {modelsWithoutSchedule.map((model) => (
                    <div
                      key={model.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-[rgb(var(--tertiary))]"
                    >
                      <Avatar className="h-8 w-8 border border-separator">
                        <AvatarImage src={model.coverUrl || `${SUPABASE_PUBLIC_URL}${model.id}/Portada/cover.jpg`} />
                        <AvatarFallback>{model.alias?.substring(0, 2) || 'IZ'}</AvatarFallback>
                      </Avatar>
                      <span className="text-body font-medium text-foreground flex-1 truncate">
                        {model.alias}
                      </span>
                      <div className="flex items-center gap-1.5 text-warning">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="text-label">Sin fecha</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Footer con botones */}
          <DialogFooter className="p-6 pt-4 gap-3 sm:gap-3 flex-row">
            <Button
              variant="outline"
              onClick={() => setShowWarning(false)}
              className="flex-1 h-12 sm:h-10 border-separator bg-transparent hover:bg-hover-overlay text-body font-medium"
            >
              Cancelar
            </Button>
            <Button
              onClick={executeShareAndSend}
              disabled={isPending}
              className="flex-1 h-12 sm:h-10 bg-[rgb(var(--purple))] hover:bg-[rgb(var(--purple))]/90 text-white text-body font-medium"
            >
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {isPending ? 'Actualizando...' : 'Copiar Igual'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
