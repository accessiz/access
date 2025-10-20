'use client'

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { toast } from 'sonner';
import { createProject } from '@/lib/actions/projects';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    // Móvil: Botón ocupa ancho completo. Escritorio: Ancho automático
    <Button type="submit" disabled={pending} form="project-create-form" className="w-full sm:w-auto">
      {pending ? 'Creando...' : 'Crear Proyecto'}
    </Button>
  );
}

export function ProjectForm() {
  const initialState: { error: string | null; success: boolean } = { error: null, success: false };
  const [state, dispatch] = useActionState(createProject, initialState);

  const [formValues, setFormValues] = useState({
    project_name: '',
    client_name: '',
    description: '',
    password: ''
  });

  useEffect(() => {
    if (state?.error) {
      toast.error('Error al crear el proyecto', {
        description: state.error,
      });
    }
  }, [state]);

  return (
    <form
      id="project-create-form"
      action={async (formData) => {
        setFormValues({
          project_name: formData.get('project_name') as string,
          client_name: formData.get('client_name') as string,
          description: formData.get('description') as string,
          password: formData.get('password') as string,
        });
        await dispatch(formData);
      }}
      className="space-y-8"
    >
      {/* --- INICIO DE LA MODIFICACIÓN HEADER --- */}
      {/* Móvil: flex-col, items-start. Escritorio: sm:flex-row, sm:items-center, sm:justify-between */}
      <header className="flex flex-col items-start gap-4 pb-6 border-b
                     sm:flex-row sm:items-center sm:justify-between">
        {/* Título y Descripción */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Crear Nuevo Proyecto</h1>
          <p className="text-muted-foreground">Rellena los detalles para tu nuevo casting.</p>
        </div>
        {/* Contenedor de Botones (con flex-wrap implícito por gap) */}
        {/* Móvil: flex-col-reverse para poner Crear arriba. Escritorio: sm:flex-row */}
        <div className="flex flex-col-reverse items-stretch gap-2 w-full sm:flex-row sm:w-auto">
          {/* Botón Cancelar (Móvil: Ancho completo. Escritorio: Ancho auto) */}
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/dashboard/projects">Cancelar</Link>
          </Button>
          {/* Botón Crear (usando el componente SubmitButton) */}
          <SubmitButton />
        </div>
      </header>
      {/* --- FIN DE LA MODIFICACIÓN HEADER --- */}


      {/* --- Resto del formulario (sin cambios) --- */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Detalles del Proyecto</h2>
        <div className="border bg-card rounded-lg p-8 grid md:grid-cols-2 gap-x-8 gap-y-6">
          <div className="space-y-2">
            <Label htmlFor="project_name">Nombre del Proyecto *</Label>
            <Input
              id="project_name"
              name="project_name"
              placeholder="Ej: Campaña Verano 2025"
              required
              // Usamos defaultValue solo si el estado tiene algo (tras error)
              defaultValue={formValues.project_name || undefined}
              // Limpiamos el valor si el formulario tuvo éxito (evita repetición tras redirect)
              key={state.success ? 'success' : 'form'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_name">Nombre del Cliente</Label>
            <Input
              id="client_name"
              name="client_name"
              placeholder="Ej: Tiendas El Sol"
              defaultValue={formValues.client_name || undefined}
              key={state.success ? 'success' : 'form'}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Notas internas sobre el proyecto, perfil buscado, etc."
              className="min-h-[120px]"
              defaultValue={formValues.description || undefined}
              key={state.success ? 'success' : 'form'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña (Opcional)</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Para proteger el enlace del cliente"
              defaultValue={formValues.password || undefined}
              key={state.success ? 'success' : 'form'}
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