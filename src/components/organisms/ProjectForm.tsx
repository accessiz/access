'use client'

// 1. CORRECCIÓN: Importamos `useActionState` desde 'react' en lugar de `useFormState`
import { useActionState, useEffect } from 'react';
// `useFormStatus` sigue viniendo de 'react-dom', lo cual es correcto.
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { toast } from 'sonner';
import { createProject } from '@/lib/actions/projects';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

// Componente para el botón de envío que muestra un estado de carga.
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} form="project-create-form">
      {pending ? 'Creando...' : 'Crear Proyecto'}
    </Button>
  );
}

export function ProjectForm() {
  // Se define explícitamente el tipo del estado inicial
  // para que coincida con la firma de la server action.
  const initialState: { error: string | null; success: boolean } = { error: null, success: false };
  
  // 2. CORRECCIÓN: Usamos `useActionState` en lugar de `useFormState`
  const [state, dispatch] = useActionState(createProject, initialState);

  useEffect(() => {
    if (state?.error) {
      toast.error('Error al crear el proyecto', {
        description: state.error,
      });
    }
    // El redirect en la server action se encarga del caso de éxito, por eso no manejamos `state.success` aquí.
  }, [state]);

  return (
    // El formulario ahora es el componente principal y tiene el espaciado general.
    <form id="project-create-form" action={dispatch} className="space-y-8">
      {/* --- Encabezado --- */}
      <header className="flex items-center justify-between gap-4 pb-6 border-b">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Crear Nuevo Proyecto</h1>
          <p className="text-muted-foreground">Rellena los detalles para tu nuevo casting.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/projects">
               Cancelar
            </Link>
          </Button>
          <SubmitButton />
        </div>
      </header>

      {/* --- Contenedor de Campos del Formulario --- */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Detalles del Proyecto</h2>
        <div className="border bg-card rounded-lg p-8 grid md:grid-cols-2 gap-x-8 gap-y-6">
          
          {/* Nombre del Proyecto */}
          <div className="space-y-2">
            <Label htmlFor="project_name">Nombre del Proyecto *</Label>
            <Input 
              id="project_name" 
              name="project_name" 
              placeholder="Ej: Campaña Verano 2025" 
              required 
            />
          </div>
          
          {/* Nombre del Cliente */}
          <div className="space-y-2">
            <Label htmlFor="client_name">Nombre del Cliente</Label>
            <Input 
              id="client_name" 
              name="client_name" 
              placeholder="Ej: Tiendas El Sol" 
            />
          </div>

          {/* Descripción */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea 
              id="description" 
              name="description" 
              placeholder="Notas internas sobre el proyecto, perfil buscado, etc."
              className="min-h-[120px]"
            />
          </div>

          {/* Contraseña */}
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña (Opcional)</Label>
            <Input 
              id="password" 
              name="password" 
              type="password"
              placeholder="Para proteger el enlace del cliente" 
            />
             <p className="text-xs text-muted-foreground">
              Si dejas esto en blanco, el enlace será público.
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}
