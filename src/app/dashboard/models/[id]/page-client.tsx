'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Model } from '../../../../lib/types';
import { ModelFormData } from '../../../../lib/schemas';
import { updateModel } from '../../../../lib/actions/models';
import { type SubmitHandler } from 'react-hook-form';
import { Button } from '../../../../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "../../../../components/ui/avatar";
import { ChevronLeft, FilePenLine } from 'lucide-react';
import { DeleteModelDialog } from '../../../../components/organisms/DeleteModelDialog';
import { ModelForm } from '../../../../components/organisms/ModelForm';
import { CompCardManager } from '../../../../components/organisms/CompCardManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

const DataPoint = ({ label, value, children }: { label: string, value?: string | number | null, children?: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <Label className="text-sm font-normal text-muted-foreground">{label}</Label>
    {children ? (
      <div className="text-foreground">{children}</div>
    ) : (
      <p className="text-foreground">{value || '—'}</p>
    )}
  </div>
);

const StaticInfoDisplay = ({ model }: { model: Model }) => (
  <div className="space-y-8">
    <Card>
      <CardHeader>
        <CardTitle>Información Básica</CardTitle>
        <CardDescription>Datos personales y de identificación.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
        <DataPoint label="Nombre Completo" value={model.full_name} />
        <DataPoint label="Fecha de Nacimiento" value={model.birth_date} />
        <DataPoint label="País" value={model.country} />
        <DataPoint label="Documento ID" value={model.national_id} />
        <DataPoint label="Género" value={model.gender} />
      </CardContent>
    </Card>
  </div>
);

const DangerZone = ({ modelId, modelAlias }: { modelId: string, modelAlias: string }) => (
  <Card className="border-destructive">
    <CardHeader>
      <CardTitle className="text-destructive">Danger Zone</CardTitle>
      <CardDescription>La acción en esta zona es permanente.</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="flex items-center justify-between rounded-lg border border-destructive bg-destructive/5 p-4">
        <div>
          <p className="font-semibold text-foreground">Eliminar este talento</p>
          <p className="text-sm text-muted-foreground">Todos los datos se perderán.</p>
        </div>
        <DeleteModelDialog modelId={modelId} modelAlias={modelAlias}>
          <Button variant="destructive">Eliminar</Button>
        </DeleteModelDialog>
      </div>
    </CardContent>
  </Card>
);

export default function ModelProfilePageClient({ initialModel }: { initialModel: Model | null }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [model, setModel] = useState(initialModel);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(true);

  // ✅ Fetch del avatar con manejo seguro
  useEffect(() => {
    const fetchAvatar = async () => {
      if (!model?.id) return;
      setAvatarLoading(true);

      try {
        const response = await fetch(`/api/models/${model.id}`);
        let data: any = null;

        try {
          data = await response.json();
        } catch {
          console.error('⚠️ Respuesta no era JSON o venía vacía');
        }

        if (!response.ok) {
          console.error('❌ Error HTTP al obtener avatar:', response.status, data);
          throw new Error(`Failed to fetch avatar (${response.status})`);
        }

        if (data?.success && data?.coverUrl) {
          // ✅ Evitar cache agregando timestamp
          setAvatarUrl(`${data.coverUrl}&t=${Date.now()}`);
        } else {
          setAvatarUrl(null);
        }

      } catch (error) {
        console.error('🚨 Error fetching avatar:', error);
        setAvatarUrl(null);
      } finally {
        setAvatarLoading(false);
      }
    };

    fetchAvatar();
  }, [model?.id]);

  if (!model) {
    return (
      <div className="text-center py-20">
        <p>No se encontró el modelo.</p>
      </div>
    );
  }

  const handleSubmit: SubmitHandler<ModelFormData> = async (data) => {
    setIsSubmitting(true);
    const result = await updateModel(model.id, data);

    if (result.success) {
      toast.success('Perfil actualizado!');
      const dataForState = { ...data, pants_size: data.pants_size !== null ? String(data.pants_size) : null };
      setModel({ ...model, ...dataForState });
      setIsEditing(false);
    } else {
      toast.error('Error al actualizar', { description: result.error });
    }
    setIsSubmitting(false);
  };

  const fallbackText = model.alias?.substring(0, 2) || 'IZ';

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-10 w-10 flex-shrink-0" asChild>
            <Link href="/dashboard/models">
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Volver</span>
            </Link>
          </Button>

          <div className="flex items-center gap-4">
            {avatarLoading ? (
              <Skeleton className="h-16 w-16 rounded-full hidden sm:flex" />
            ) : (
              <Avatar className="h-16 w-16 hidden sm:flex">
                <AvatarImage src={avatarUrl || ''} alt={model.alias || 'Avatar'} />
                <AvatarFallback className="text-xl">{fallbackText}</AvatarFallback>
              </Avatar>
            )}
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{model.alias}</h1>
              <p className="text-muted-foreground">{model.full_name}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button form="model-edit-form" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Guardar'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <FilePenLine className="mr-2 h-4 w-4" />
              Editar
            </Button>
          )}
        </div>
      </header>

      <main className="mx-auto w-full space-y-12">
        {isEditing ? (
          <ModelForm model={model} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        ) : (
          <>
            <StaticInfoDisplay model={model} />
            <div className="grid gap-8">
              <CompCardManager modelId={model.id} />
            </div>
            <DangerZone modelId={model.id} modelAlias={model.alias || 'este modelo'} />
          </>
        )}
      </main>
    </div>
  );
}
