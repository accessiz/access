'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

// 1. IMPORTACIONES NECESARIAS
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { modelFormSchema, ModelFormData } from '@/lib/schemas';

import { createModel } from '@/lib/actions/models';
import { Button } from '@/components/ui/button';
import { ModelForm } from '@/components/organisms/ModelForm';

export default function NewModelPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. INICIALIZAMOS 'useForm' AQUÍ (en el padre)
  const form = useForm<ModelFormData>({
    resolver: zodResolver(modelFormSchema),
    // 3. Definimos los valores por defecto para un formulario vacío
    defaultValues: {
      alias: '',
      full_name: '',
      national_id: '',
      gender: null,
      birth_date: '',
      country: null,
      height_cm: null,
      shoulders_cm: null,
      chest_cm: null,
      bust_cm: null,
      waist_cm: null,
      hips_cm: null,
      top_size: null,
    pants_size: null,
    shoe_size_us: null,
      eye_color: null,
      hair_color: null,
      instagram: '',
      tiktok: '',
      email: '',
      phone_e164: '',
      status: 'active',
      date_joined_agency: '',
    },
  });

  const handleSubmit: (data: ModelFormData) => Promise<void> = async (data) => {
    setIsSubmitting(true);
    const result = await createModel(data);

    if (result.success && result.modelId) {
      toast.success('Perfil creado con éxito!', {
        description: `El perfil para ${data.alias} ha sido guardado.`
      });
      router.push(`/dashboard/models/${result.modelId}`);
    } else {
      toast.error('Error al crear el perfil', { description: result.error });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between gap-4 pb-6 border-b">
        <div>
          <h1 className="text-heading-32">Añadir Nuevo Talento</h1>
          <p className="text-muted-foreground">Rellena los datos para crear un nuevo perfil.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/models">
               Cancelar
            </Link>
          </Button>
          <Button form="model-create-form" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creando...' : 'Crear Perfil'}
          </Button>
        </div>
      </header>

      <div className="mx-auto">
          {/* 4. ENVOLVEMOS 'ModelForm' CON 'FormProvider' Y '<form>' */}
          <FormProvider {...form}>
            <form id="model-create-form" onSubmit={form.handleSubmit(handleSubmit)}>
              <ModelForm
                  // No pasamos 'model' (porque es nuevo)
                  isSubmitting={isSubmitting}
                  // No pasamos 'onSubmit' (lo maneja el <form>)
              />
            </form>
          </FormProvider>
      </div>
    </div>
  );
}