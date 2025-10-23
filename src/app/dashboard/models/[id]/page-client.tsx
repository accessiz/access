'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FormProvider } from 'react-hook-form';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
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

// CORRECCIÓN: Define el tipo extendido que incluye las URLs/paths
type ModelWithImages = Model & {
  coverUrl?: string | null;
  portfolioUrl?: string | null;
  compCardUrls?: (string | null)[];
  cover_path?: string | null;
  portfolio_path?: string | null;
  comp_card_paths?: (string | null)[];
};

interface ModelProfileClientProps {
  // CORRECCIÓN: Usa el tipo extendido aquí
  initialModel: ModelWithImages;
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

  const safeParseInt = (value: string | number | null | undefined): number | null => {
    if (value === null || value === undefined || value === '') return null;
    const parsed = parseInt(String(value), 10);
    return isNaN(parsed) ? null : parsed;
  };

  // Normalize persisted values to the supported US size range and increments.
  const normalizeShoeSize = (value: number | string | null | undefined): number | null => {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    const rounded = Number(parsed.toFixed(1));
    const isHalfStep = Number.isInteger(rounded * 2);
    if (!isHalfStep) return null;
    if (rounded < 3.5 || rounded > 15) return null;
    return rounded;
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
  shoe_size_us: normalizeShoeSize(initialModel.shoe_size_us),
      instagram: initialModel.instagram ?? '',
      tiktok: initialModel.tiktok ?? '',
      status: initialModel.status ?? 'active',
      eye_color: initialModel.eye_color ?? '',
      hair_color: initialModel.hair_color ?? '',
      date_joined_agency: initialModel.date_joined_agency ? new Date(initialModel.date_joined_agency).toISOString().split('T')[0] : '',
    },
  });

  async function onSubmit(data: ModelFormData) {
    const result = await updateModel(initialModel.id, data);
    if (result.success) {
      toast.success('Modelo actualizado correctamente.');
      setIsEditing(false);
    } else {
      type ActionResult = { success?: boolean; error?: string; errors?: Record<string, string> };
      const parsed = result as ActionResult;
      if (parsed.errors) {
          const fieldErrors = parsed.errors as Record<string, string>;
          for (const key of Object.keys(fieldErrors)) {
            form.setError(key as keyof ModelFormData, { type: 'server', message: fieldErrors[key] });
          }
        toast.error('Corrige los errores en el formulario.');
      } else {
        toast.error('Error al actualizar el modelo', {
          description: result.error,
        });
      }
    }
  }

  const { formState: { isSubmitting } } = form;

  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col items-start gap-4 pb-6 border-b
                     md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditing ? `Editando Perfil de ${initialModel.alias || initialModel.full_name}` : `Perfil de ${initialModel.alias || initialModel.full_name}`}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? 'Actualiza la información y las imágenes del talento.' : 'Visualiza la información del talento.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {isEditing ? (
            <>
              <Button variant="outline" type="button" onClick={handleCancel} className="flex-grow md:flex-grow-0">
                <X className="mr-2 h-4 w-4" /> Cancelar
              </Button>
              <Button type="button" disabled={isSubmitting} className="flex-grow md:flex-grow-0" onClick={() => {
                const formEl = document.getElementById('model-edit-form') as HTMLFormElement | null;
                if (formEl) {
                  if (typeof formEl.requestSubmit === 'function') formEl.requestSubmit();
                  else formEl.submit();
                }
              }}>
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </>
          ) : (
            <>
               <Button variant="outline" asChild className="flex-grow md:flex-grow-0">
                <Link href="/dashboard/models">
                   Volver
                </Link>
              </Button>
              <Button type="button" onClick={(e) => { e.preventDefault(); setTimeout(() => setIsEditing(true), 0); }} className="flex-grow md:flex-grow-0">
                <Pencil className="mr-2 h-4 w-4" /> Editar
              </Button>
            </>
          )}
        </div>
      </header>

      {isEditing ? (
        <FormProvider {...form}>
          <form id="model-edit-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <ModelForm
                isSubmitting={isSubmitting}
            />
          </form>
        </FormProvider>
      ) : (
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
                    <Grid cols={2} className="md:grid-cols-3">
                        <InfoDisplay label="Estatura (cm)" value={initialModel.height_cm} />
                        {initialModel.gender === 'Male' ? <InfoDisplay label="Pecho (cm)" value={initialModel.chest_cm} /> : <InfoDisplay label="Busto (cm)" value={initialModel.bust_cm} />}
                        <InfoDisplay label="Cintura (cm)" value={initialModel.waist_cm} />
                        <InfoDisplay label="Cadera (cm)" value={initialModel.hips_cm} />
                        <InfoDisplay label="Talla Camisa/Blusa" value={initialModel.top_size} />
                        <InfoDisplay label="Talla Pantalón" value={initialModel.pants_size} />
                        <InfoDisplay label="Talla Zapato (US)" value={initialModel.shoe_size_us} />
                    </Grid>
                </CardContent>
            </Card>
        </div>
      )}

      {/* CORRECCIÓN: Se eliminan los '(as any)' */}
      <CompCardManager
        modelId={initialModel.id}
        initialCoverUrl={initialModel.coverUrl ?? null}
        initialPortfolioUrl={initialModel.portfolioUrl ?? null}
        initialCompCardUrls={initialModel.compCardUrls ?? [null, null, null, null]}
        initialCoverPath={initialModel.cover_path ?? null}
        initialPortfolioPath={initialModel.portfolio_path ?? null}
        initialCompCardPaths={initialModel.comp_card_paths ?? [null, null, null, null]}
      />

      <div
        className="rounded-lg p-6 mt-6"
        style={{
          backgroundColor: 'rgb(var(--background))',
          border: '1px solid',
          borderColor: 'rgb(var(--destructive))',
        }}
      >
        <h3 className="text-lg font-semibold" style={{ color: 'rgb(var(--destructive))' }}>Zona de peligro</h3>
        <p className="text-sm text-muted-foreground mt-2">Eliminar este modelo es irreversible. Se borrarán los datos y archivos asociados.</p>
        <div className="mt-4">
          <DeleteModelDialog modelId={initialModel.id} modelAlias={initialModel.alias || 'este modelo'}>
            <Button variant="destructive">Eliminar Modelo</Button>
          </DeleteModelDialog>
        </div>
      </div>
    </div>
  );
}