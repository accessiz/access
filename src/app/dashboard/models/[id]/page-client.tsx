'use client';

import { zodResolver } from '@hookform/resolvers/zod';
// 1. Importamos FormProvider
import { useForm, FormProvider } from 'react-hook-form';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { modelFormSchema, ModelFormData } from '../../../../lib/schemas';
import { Model } from '../../../../lib/types';
import { updateModel } from '../../../../lib/actions/models';
import { toast } from 'sonner';
import { Grid } from '../../../../components/ui/grid';
import { CompCardManager } from '../../../../components/organisms/CompCardManager';
import { DeleteModelDialog } from '../../../../components/organisms/DeleteModelDialog';
import Link from 'next/link';
import { useState } from 'react';
import { Pencil, Save, X } from 'lucide-react';
import { ModelForm } from '../../../../components/organisms/ModelForm';

interface ModelProfileClientProps {
  initialModel: Model;
}

// Componente para mostrar la información en modo de solo lectura
const InfoDisplay = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
  <div className="space-y-1">
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    <p className="text-base">{value || '-'}</p>
  </div>
);


export default function ModelProfilePageClient({ initialModel }: ModelProfileClientProps) {
  const [isEditing, setIsEditing] = useState(false);

  // 2. El hook 'useForm' se queda aquí, en el padre.
  const safeParseInt = (value: string | number | null | undefined): number | null => {
    if (value === null || value === undefined || value === '') return null;
    const parsed = parseInt(String(value), 10);
    return isNaN(parsed) ? null : parsed;
  };

  const form = useForm<ModelFormData>({
    resolver: zodResolver(modelFormSchema),
    defaultValues: {
      alias: initialModel.alias ?? '',
      full_name: initialModel.full_name ?? '',
      gender: initialModel.gender ?? null,
      birth_date: initialModel.birth_date ?? '',
      national_id: initialModel.national_id ?? '',
      phone_e164: initialModel.phone_e164 ?? '',
      email: initialModel.email ?? '',
      country: initialModel.country ?? null,
      height_cm: initialModel.height_cm ?? null,
      shoulders_cm: initialModel.shoulders_cm ?? null,
      chest_cm: initialModel.chest_cm ?? null,
      bust_cm: initialModel.bust_cm ?? null,
      waist_cm: initialModel.waist_cm ?? null,
      hips_cm: initialModel.hips_cm ?? null,
      top_size: initialModel.top_size ?? null,
      pants_size: safeParseInt(initialModel.pants_size),
      shoe_size_eu: initialModel.shoe_size_eu ?? null,
      instagram: initialModel.instagram ?? '',
      tiktok: initialModel.tiktok ?? '',
      status: initialModel.status ?? 'active',
      eye_color: initialModel.eye_color ?? '',
      hair_color: initialModel.hair_color ?? '',
      // Añadimos el campo que faltaba
      date_joined_agency: initialModel.date_joined_agency ? new Date(initialModel.date_joined_agency).toISOString().split('T')[0] : '',
    },
  });

  async function onSubmit(data: ModelFormData) {
    const result = await updateModel(initialModel.id, data);
    if (result.success) {
      toast.success('Modelo actualizado correctamente.');
      setIsEditing(false); 
    } else {
      toast.error('Error al actualizar el modelo', {
        description: result.error,
      });
    }
  }
  
  const { formState: { isSubmitting } } = form;

  const handleCancel = () => {
    form.reset(); 
    setIsEditing(false);
  }

  return (
    <div className="space-y-8">
       <header className="flex items-center justify-between gap-4 pb-6 border-b">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditing ? `Editando Perfil de ${initialModel.alias || initialModel.full_name}` : `Perfil de ${initialModel.alias || initialModel.full_name}`}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? 'Actualiza la información y las imágenes del talento.' : 'Visualiza la información del talento.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <X className="mr-2 h-4 w-4" /> Cancelar
              </Button>
              <Button form="model-edit-form" type="submit" disabled={isSubmitting}>
                <Save className="mr-2 h-4 w-4" /> 
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </>
          ) : (
            <>
               <Button variant="outline" asChild>
                <Link href="/dashboard/models">
                   Volver
                </Link>
              </Button>
              <DeleteModelDialog modelId={initialModel.id} modelAlias={initialModel.alias || 'este modelo'}>
                  <Button variant="destructive">
                    Eliminar Perfil
                  </Button>
              </DeleteModelDialog>
              <Button onClick={() => setIsEditing(true)}>
                <Pencil className="mr-2 h-4 w-4" /> Editar
              </Button>
            </>
          )}
        </div>
      </header>
      
      {isEditing ? (
        // 3. Envolvemos el componente del formulario
        <FormProvider {...form}>
          <form id="model-edit-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <ModelForm
                model={initialModel}
                isSubmitting={isSubmitting}
                // 4. La prop 'onSubmit' se elimina, ya la maneja el <form>
            />
          </form>
        </FormProvider>
      ) : (
        // MODO VISTA: (Este se queda igual)
        <div className="space-y-8">
            <Card>
                <CardHeader><CardTitle>Información Personal</CardTitle></CardHeader>
                <CardContent>
                    <Grid cols={3}>
                        <InfoDisplay label="Nombre Completo" value={initialModel.full_name} />
                        <InfoDisplay label="Alias" value={initialModel.alias} />
                        <InfoDisplay label="Género" value={initialModel.gender} />
                        <InfoDisplay label="DPI (CUI)" value={initialModel.national_id} />
                        <InfoDisplay label="Teléfono" value={initialModel.phone_e164} />
                        <InfoDisplay label="Email" value={initialModel.email} />
                        <InfoDisplay label="País" value={initialModel.country} />
                    </Grid>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Medidas y Tallas</CardTitle></CardHeader>
                <CardContent>
                    <Grid cols={3}>
                        <InfoDisplay label="Estatura (cm)" value={initialModel.height_cm} />
                        {initialModel.gender === 'Male' ? <InfoDisplay label="Pecho (cm)" value={initialModel.chest_cm} /> : <InfoDisplay label="Busto (cm)" value={initialModel.bust_cm} />}
                        <InfoDisplay label="Cintura (cm)" value={initialModel.waist_cm} />
                        <InfoDisplay label="Cadera (cm)" value={initialModel.hips_cm} />
                        <InfoDisplay label="Talla Camisa/Blusa" value={initialModel.top_size} />
                        <InfoDisplay label="Talla Pantalón" value={initialModel.pants_size} />
                        <InfoDisplay label="Talla Zapato (EU)" value={initialModel.shoe_size_eu} />
                    </Grid>
                </CardContent>
            </Card>
        </div>
      )}
      
      <CompCardManager modelId={initialModel.id} />
    </div>
  );
}