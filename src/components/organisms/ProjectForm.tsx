'use client'

import { useActionState, useEffect } from 'react';
import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { toast } from 'sonner';
import { createProject, updateProject } from '@/lib/actions/projects';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { projectFormSchema, ProjectFormData } from '@/lib/schemas/projects';
import { Trash2, Plus, Save, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Project } from '@/lib/types';

interface ProjectFormProps {
  initialData?: Project;
  onCancel?: () => void;
}

export function ProjectForm({ initialData, onCancel }: ProjectFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      project_name: initialData?.project_name || '',
      client_name: initialData?.client_name || '',
      password: initialData?.password || '',
      schedule: initialData?.schedule && initialData.schedule.length > 0
        ? initialData.schedule.map(item => ({
            date: item.date ? item.date.split('T')[0] : '', // Formatear fecha
            startTime: item.startTime || '',
            endTime: item.endTime || '',
          }))
        : [{ date: '', startTime: '', endTime: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'schedule',
  });
  
  const action = isEditing ? updateProject.bind(null, initialData.id) : createProject;
  type ActionState = { success: boolean; error?: string; errors?: Record<string, string>, projectId?: string };
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(action, undefined);

  useEffect(() => {
    if (state?.success) {
      toast.success(isEditing ? '¡Proyecto actualizado!' : '¡Proyecto creado con éxito!');
      if (onCancel) {
        onCancel(); // Si está en modo edición, simplemente cancela la edición
      } else {
         router.push(`/dashboard/projects/${state.projectId}`);
      }
    } else if (state?.error) {
      toast.error(isEditing ? 'Error al actualizar' : 'Error al crear', {
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
  }, [state, router, form, isEditing, onCancel]);

  return (
    <FormProvider {...form}>
      <form id="project-form" action={formAction} className="space-y-8">
        <header className="flex flex-col items-start gap-4 pb-6 border-b sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-heading-32">{isEditing ? `Editando: ${initialData.project_name}` : 'Nuevo Proyecto'}</h1>
          </div>
          <div className="flex flex-col-reverse items-stretch gap-2 w-full sm:flex-row sm:w-auto">
            <Button variant="outline" type="button" onClick={onCancel ? onCancel : () => router.push('/dashboard/projects')} className="w-full sm:w-auto">
               <X className="mr-2 h-4 w-4" /> Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                {isPending ? (isEditing ? 'Guardando...' : 'Creando...') : (isEditing ? <><Save className="mr-2 h-4 w-4"/> Guardar Cambios</> : 'Crear Proyecto')}
            </Button>
          </div>
        </header>

        <div className="space-y-4">
          <h2 className="text-heading-20">Detalles del Proyecto</h2>
          <div className="border bg-card rounded-lg p-8 grid md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-2">
              <Label htmlFor="project_name">Nombre del Proyecto *</Label>
              <Input {...form.register('project_name')} />
              {form.formState.errors.project_name && <p className="text-label-12 text-destructive mt-1">{form.formState.errors.project_name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_name">Nombre del Cliente</Label>
              <Input {...form.register('client_name')} />
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
              <Label htmlFor="password">Contraseña</Label>
              <Input type="password" {...form.register('password')} />
              {form.formState.errors.password && <p className="text-label-12 text-destructive mt-1">{form.formState.errors.password.message}</p>}
            </div>
          </div>
        </div>

      </form>
    </FormProvider>
  );
}
