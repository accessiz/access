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
import { Loader2 } from 'lucide-react';

export default function NewModelPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. INICIALIZAMOS 'useForm' AQUÍ (en el padre)
  // Obtener la fecha de hoy en formato YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];

  const form = useForm<ModelFormData>({
    resolver: zodResolver(modelFormSchema),
    // 3. Definimos los valores por defecto para un formulario vacío
    defaultValues: {
      alias: '',
      full_name: '',
      national_id: '',
      passport_number: '',
      gender: null,
      birth_date: '',
      country: null,
      birth_country: null,
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
      date_joined_agency: today, // Por defecto la fecha de hoy
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

  const handleInvalid = () => {
    toast.error('Faltan campos obligatorios', {
      description: 'Revisa los campos marcados en rojo antes de continuar.',
    });
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto space-y-8 pb-6">
      <header className="flex items-center justify-between gap-x-4 gap-y-4 pb-6 border-b">
        <div>
          <h1 className="text-display">Añadir Nuevo Talento</h1>
          <p className="text-label text-muted-foreground">Rellena los datos para crear un nuevo perfil.</p>
        </div>
        <div className="flex items-center gap-x-2 gap-y-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/models">
              Cancelar
            </Link>
          </Button>
          <Button form="model-create-form" type="submit" disabled={isSubmitting} className="cursor-pointer">
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando...</>
            ) : (
              'Crear Perfil'
            )}
          </Button>
        </div>
      </header>

      <div className="mx-auto">
        {/* 4. ENVOLVEMOS 'ModelForm' CON 'FormProvider' Y '<form>' */}
        <FormProvider {...form}>
          <form id="model-create-form" onSubmit={form.handleSubmit(handleSubmit, handleInvalid)}>
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