
'use client'

import { useActionState, useEffect } from 'react';
import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { toast } from 'sonner';
import { createProject } from '@/lib/actions/projects';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { projectFormSchema, ProjectFormData } from '@/lib/schemas/projects';
import { Trash2, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ProjectForm() {
  const router = useRouter();

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      project_name: '',
      client_name: '',
      password: '',
      schedule: [{ date: '', startTime: '', endTime: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'schedule',
  });

  type ActionState = { success: boolean; error?: string; errors?: Record<string, string>, projectId?: string };
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(createProject, undefined);

  useEffect(() => {
    if (state?.success && state.projectId) {
      toast.success('¡Proyecto creado con éxito!');
      router.push(`/dashboard/projects/${state.projectId}`);
    } else if (state?.error) {
      toast.error('Error al crear el proyecto', {
        description: state.error,
      });
      // Set field errors from server
      if (state.errors) {
        for (const [fieldName, errorMessages] of Object.entries(state.errors)) {
          form.setError(fieldName as keyof ProjectFormData, {
            type: 'server',
            message: Array.isArray(errorMessages) ? errorMessages[0] : errorMessages,
          });
        }
      }
    }
  }, [state, router, form]);

  return (
    <FormProvider {...form}>
      <form id="project-create-form" action={formAction} className="space-y-8">
        <header className="flex flex-col items-start gap-4 pb-6 border-b sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-heading-32">Crear Nuevo Proyecto</h1>
            <p className="text-muted-foreground">Rellena los detalles para tu nuevo casting.</p>
          </div>
          <div className="flex flex-col-reverse items-stretch gap-2 w-full sm:flex-row sm:w-auto">
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/dashboard/projects">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                {isPending ? 'Creando...' : 'Crear Proyecto'}
            </Button>
          </div>
        </header>

        <div className="space-y-4">
          <h2 className="text-heading-20">Detalles del Proyecto</h2>
          <div className="border bg-card rounded-lg p-8 grid md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-2">
              <Label htmlFor="project_name">Nombre del Proyecto *</Label>
              <Input {...form.register('project_name')} placeholder="Ej: Campaña Verano 2025" />
              {form.formState.errors.project_name && <p className="text-label-12 text-destructive mt-1">{form.formState.errors.project_name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_name">Nombre del Cliente</Label>
              <Input {...form.register('client_name')} placeholder="Ej: Tiendas El Sol" />
              {form.formState.errors.client_name && <p className="text-label-12 text-destructive mt-1">{form.formState.errors.client_name.message}</p>}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-heading-20">Fechas y Horarios del Evento</h2>
          <div className="border bg-card rounded-lg p-8 space-y-4">
            {fields.map((item, index) => (
              <div key={item.id} className="grid grid-cols-[1fr_auto_auto_auto] items-end gap-4 p-4 rounded-md border bg-muted/30">
                <div className="space-y-2">
                  <Label htmlFor={`schedule.${index}.date`}>Fecha</Label>
                  <Input type="date" {...form.register(`schedule.${index}.date`)} />
                  {form.formState.errors.schedule?.[index]?.date && <p className="text-label-12 text-destructive mt-1">{form.formState.errors.schedule[index]?.date?.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`schedule.${index}.startTime`}>Hora Inicio</Label>
                  <Input type="time" {...form.register(`schedule.${index}.startTime`)} />
                   {form.formState.errors.schedule?.[index]?.startTime && <p className="text-label-12 text-destructive mt-1">{form.formState.errors.schedule[index]?.startTime?.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`schedule.${index}.endTime`}>Hora Fin</Label>
                  <Input type="time" {...form.register(`schedule.${index}.endTime`)} />
                  {form.formState.errors.schedule?.[index]?.endTime && <p className="text-label-12 text-destructive mt-1">{form.formState.errors.schedule[index]?.endTime?.message}</p>}
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
             {form.formState.errors.schedule?.root && <p className="text-label-12 text-destructive mt-1">{form.formState.errors.schedule.root.message}</p>}
            <Button type="button" variant="outline" onClick={() => append({ date: '', startTime: '', endTime: '' })}>
              <Plus className="mr-2 h-4 w-4" /> Añadir otro horario
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-heading-20">Seguridad del Proyecto</h2>
          <div className="border bg-card rounded-lg p-8 grid md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña (Opcional)</Label>
              <Input type="password" {...form.register('password')} placeholder="Para proteger el enlace del cliente" />
              {form.formState.errors.password && <p className="text-label-12 text-destructive mt-1">{form.formState.errors.password.message}</p>}
              <p className="text-label-12 text-muted-foreground">Si dejas esto en blanco, el enlace será público.</p>
            </div>
          </div>
        </div>

      </form>
    </FormProvider>
  );
}
