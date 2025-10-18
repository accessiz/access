'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ModelFormData } from '@/lib/schemas';
import { createModel } from '@/lib/actions/models';

import { Button } from '@/components/ui/button';
import { ModelForm } from '@/components/organisms/ModelForm';

export default function NewModelPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          <h1 className="text-3xl font-bold tracking-tight">Añadir Nuevo Talento</h1>
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
          <ModelForm
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
          />
      </div>
    </div>
  );
}
