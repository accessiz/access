'use client';

import { useState, useEffect, useTransition } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Copy, Check, ExternalLink, Eye, EyeOff } from 'lucide-react';
import type { ProjectLinksCardProps } from './ProjectLinksCard.types';
import { timestampToGuatemalaDateTime } from '@/lib/actions/projects/helpers';
import { updateProjectStatus } from '@/lib/actions/projects';
import { logActivity } from '@/lib/activity-logger';

const formatDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number);
  if (year && month && day) {
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${day} ${months[month - 1]}`;
  }
  return new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

export function ProjectLinksCard({ project, onStatusChange }: ProjectLinksCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const applyEnd = project.apply_end_at ? timestampToGuatemalaDateTime(project.apply_end_at) : null;
  const [copiedClientLink, setCopiedClientLink] = useState(false);
  const [copiedClientPass, setCopiedClientPass] = useState(false);
  const [copiedModelLink, setCopiedModelLink] = useState(false);
  const [copiedClientMsg, setCopiedClientMsg] = useState(false);
  const [copiedModelMsg, setCopiedModelMsg] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleClientAction = () => {
    if (project.status === 'draft') {
      startTransition(async () => {
        const result = await updateProjectStatus(project.id, 'sent');
        if (result.success) {
          onStatusChange?.('sent');
          toast.info('El estado del proyecto se actualizó a "Enviado".');
        } else {
          toast.error('No se pudo actualizar el estado del proyecto.');
        }
      });
    }
  };

  // Generate public urls on mount to prevent SSR hydration mismatches
  const [clientUrl, setClientUrl] = useState('');
  const [modelUrl, setModelUrl] = useState('');

  useEffect(() => {
    setClientUrl(`${window.location.origin}/c/${project.public_id || project.id}`);
    setModelUrl(`${window.location.origin}/m/${project.public_id || project.id}`);
  }, [project.public_id, project.id]);

  const clientShareMsg = `Hola,\n\nTe compartimos el enlace para la selección del casting del proyecto "${project.project_name}".\n\nEnlace: ${clientUrl}\n${project.password ? `Contraseña: ${project.password}\n` : ''}\nPara cualquier consulta, quedamos a disposición.\nIZ Management | IZ ACCESS`;

  const modelShareMsg = `Hola,\n\nTe compartimos el enlace para registrar tu disponibilidad para el proyecto "${project.project_name}".\n\nEnlace: ${modelUrl}\n\nPor favor ingresa y completa tu postulación.\n\nIZ Management | IZ ACCESS`;

  async function copyText(text: string, setCopiedState: (v: boolean) => void, successMsg: string) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedState(true);
        toast.success(successMsg);
        setTimeout(() => setCopiedState(false), 2000);
        return;
      } catch (err) {
        console.warn('API de portapapeles falló, usando fallback');
      }
    }

    let textArea: HTMLTextAreaElement | null = null;
    try {
      textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.top = '-9999px';
      textArea.style.left = '-9999px';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      if (successful) {
        setCopiedState(true);
        toast.success(successMsg);
        setTimeout(() => setCopiedState(false), 2000);
      } else {
        toast.error('No se pudo copiar el texto.');
      }
    } catch (err) {
      toast.error('Error al copiar al portapapeles.');
    } finally {
      if (textArea) {
        document.body.removeChild(textArea);
      }
    }
  }

  return (
    <Card className="h-full flex flex-col bg-sys-bg-secondary border shadow-sm">
      <CardHeader className="pb-3 border-b shrink-0">
        <CardTitle className="text-title font-semibold">
          Enlaces del Proyecto
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 flex-1 flex flex-col justify-between gap-6">
        {/* CLIENT ACCESS SECTION */}
        <div className="space-y-4">
          <div className="text-body font-semibold text-foreground">
            Acceso del Cliente
          </div>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="client-link-input" className="text-label text-muted-foreground">
                Enlace de Selección
              </Label>
              <div className="flex items-center gap-1.5">
                <Input
                  id="client-link-input"
                  value={clientUrl}
                  readOnly
                  className="h-9 font-mono text-label bg-background w-0 flex-1 min-w-0"
                />
                <Button
                  size="icon"
                  variant="outline"
                  className="h-9 w-9 shrink-0 border-separator hover:bg-hover-overlay"
                  onClick={async () => {
                    await copyText(clientUrl, setCopiedClientLink, 'Enlace del cliente copiado');
                    await logActivity({
                      category: 'project',
                      title: `Copiaste el enlace de selección para el cliente del proyecto "${project.project_name}"`,
                      metadata: { project_id: project.id, entity_id: project.id, entity_type: 'project', action: 'copied_client_link' }
                    });
                    handleClientAction();
                  }}
                  title="Copiar Enlace"
                >
                  {copiedClientLink ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-9 w-9 shrink-0 border-separator hover:bg-hover-overlay"
                  asChild
                >
                  <a href={clientUrl} target="_blank" rel="noopener noreferrer" title="Abrir Enlace">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="client-pass-input" className="text-label text-muted-foreground">
                Contraseña de Acceso
              </Label>
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <Input
                    id="client-pass-input"
                    value={project.password || ''}
                    placeholder={project.password ? '' : 'Sin Contraseña'}
                    readOnly
                    type={showPassword ? 'text' : 'password'}
                    className={`h-9 font-mono text-label bg-background w-full pr-10 ${
                      !project.password ? 'text-red-500 font-medium placeholder-red-500/80' : ''
                    }`}
                  />
                  {project.password && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground bg-transparent border-0 cursor-pointer p-0"
                      title={showPassword ? 'Ocultar Contraseña' : 'Mostrar Contraseña'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  )}
                </div>
                {project.password && (
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-9 w-9 shrink-0 border-separator hover:bg-hover-overlay"
                    onClick={async () => {
                      await copyText(project.password || '', setCopiedClientPass, 'Contraseña copiada');
                      await logActivity({
                        category: 'project',
                        title: `Copiaste la contraseña de acceso del cliente para el proyecto "${project.project_name}"`,
                        metadata: { project_id: project.id, entity_id: project.id, entity_type: 'project', action: 'copied_client_password' }
                      });
                    }}
                    title="Copiar Contraseña"
                  >
                    {copiedClientPass ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-center border-separator hover:bg-hover-overlay text-body py-4"
              onClick={async () => {
                await copyText(clientShareMsg, setCopiedClientMsg, 'Mensaje completo del cliente copiado');
                await logActivity({
                  category: 'project',
                  title: `Copiaste el mensaje de acceso del cliente para el proyecto "${project.project_name}"`,
                  metadata: { project_id: project.id, entity_id: project.id, entity_type: 'project', action: 'copied_client_message' }
                });
                handleClientAction();
              }}
            >
              {copiedClientMsg ? (
                <>
                  <Check className="h-4 w-4 text-success" />
                  Mensaje Copiado
                </>
              ) : (
                'Copiar Mensaje'
              )}
            </Button>
          </div>
        </div>

        <Separator />

        {/* MODELS ACCESS SECTION */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="text-body font-semibold text-foreground">
              Acceso de Modelos
            </div>
            {applyEnd && (
              <span className="text-label text-red-500 font-medium shrink-0">
                Límite: {formatDate(applyEnd.date)}, {applyEnd.time}
              </span>
            )}
          </div>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="model-link-input" className="text-label text-muted-foreground">
                Enlace para Aplicar
              </Label>
              <div className="flex items-center gap-1.5">
                <Input
                  id="model-link-input"
                  value={modelUrl}
                  readOnly
                  className="h-9 font-mono text-label bg-background w-0 flex-1 min-w-0"
                />
                <Button
                  size="icon"
                  variant="outline"
                  className="h-9 w-9 shrink-0 border-separator hover:bg-hover-overlay"
                  onClick={async () => {
                    await copyText(modelUrl, setCopiedModelLink, 'Enlace de modelos copiado');
                    await logActivity({
                      category: 'project',
                      title: `Copiaste el enlace de aplicación para modelos del proyecto "${project.project_name}"`,
                      metadata: { project_id: project.id, entity_id: project.id, entity_type: 'project', action: 'copied_model_link' }
                    });
                  }}
                  title="Copiar Enlace"
                >
                  {copiedModelLink ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-9 w-9 shrink-0 border-separator hover:bg-hover-overlay"
                  asChild
                >
                  <a href={modelUrl} target="_blank" rel="noopener noreferrer" title="Abrir Enlace">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-center border-separator hover:bg-hover-overlay text-body py-4"
              onClick={async () => {
                await copyText(modelShareMsg, setCopiedModelMsg, 'Mensaje completo de modelos copiado');
                await logActivity({
                  category: 'project',
                  title: `Copiaste el mensaje de aplicación para modelos del proyecto "${project.project_name}"`,
                  metadata: { project_id: project.id, entity_id: project.id, entity_type: 'project', action: 'copied_model_message' }
                });
              }}
            >
              {copiedModelMsg ? (
                <>
                  <Check className="h-4 w-4 text-success" />
                  Mensaje Copiado
                </>
              ) : (
                'Copiar Mensaje'
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
