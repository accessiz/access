'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Model } from '@/lib/types';
import { ModelFormData } from '@/lib/schemas';
import { updateModel } from '@/lib/actions/models';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, FilePenLine } from 'lucide-react';
import { DeleteModelDialog } from '@/components/organisms/DeleteModelDialog';
import { ModelForm } from '@/components/organisms/ModelForm';

// --- COMPONENTES DE VISUALIZACIÓN ---

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

const StaticInfoDisplay = ({ model }: { model: Model }) => {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Información Básica</CardTitle>
                    <CardDescription>Datos personales y de identificación del talento.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
                    <DataPoint label="Nombre Completo" value={model.full_name} />
                    <DataPoint label="Fecha de Nacimiento" value={model.birth_date} />
                    <DataPoint label="País" value={model.country} />
                    <DataPoint label="Documento ID" value={model.national_id} />
                    <DataPoint label="Género" value={model.gender} />
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Medidas y Tallas</CardTitle>
                    <CardDescription>Medidas corporales y tallas de vestuario.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8">
                    <DataPoint label="Estatura" value={model.height_cm ? `${model.height_cm} cm` : null} />
                    <DataPoint label="Hombros" value={model.shoulders_cm ? `${model.shoulders_cm} cm` : null} />
                    <DataPoint label="Pecho" value={model.chest_cm ? `${model.chest_cm} cm` : null} />
                    <DataPoint label="Busto" value={model.bust_cm ? `${model.bust_cm} cm` : null} />
                    <DataPoint label="Cintura" value={model.waist_cm ? `${model.waist_cm} cm` : null} />
                    <DataPoint label="Cadera" value={model.hips_cm ? `${model.hips_cm} cm` : null} />
                    <DataPoint label="Talla Superior" value={model.top_size} />
                    <DataPoint label="Pantalón" value={model.pants_size} />
                    <DataPoint label="Zapato (EU)" value={model.shoe_size_eu} />
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Contacto y Redes Sociales</CardTitle>
                    <CardDescription>Canales de comunicación y perfiles en línea.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
                    <DataPoint label="Email" value={model.email} />
                    <DataPoint label="Teléfono" value={model.phone_number} />
                    <DataPoint label="Instagram">
                        {model.instagram ? <a href={`https://instagram.com/${model.instagram}`} target="_blank" rel="noopener noreferrer" className="text-foreground hover:underline">@{model.instagram}</a> : '—'}
                    </DataPoint>
                    <DataPoint label="TikTok">
                        {model.tiktok ? <a href={`https://tiktok.com/@${model.tiktok}`} target="_blank" rel="noopener noreferrer" className="text-foreground hover:underline">@{model.tiktok}</a> : '—'}
                    </DataPoint>
                </CardContent>
            </Card>
        </div>
    );
};

const DangerZone = ({ modelId, modelAlias }: { modelId: string, modelAlias: string }) => (
    <Card className="border-destructive">
        <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
                La acción en esta zona es permanente y no se puede deshacer.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-between rounded-lg border border-destructive bg-destructive/5 p-4">
                <div>
                    <p className="font-semibold text-foreground">Eliminar este talento</p>
                    <p className="text-sm text-muted-foreground">
                        Una vez eliminado, todos los datos asociados se perderán para siempre.
                    </p>
                </div>
                <DeleteModelDialog modelId={modelId} modelAlias={modelAlias}>
                    <Button variant="destructive">Eliminar</Button>
                </DeleteModelDialog>
            </div>
        </CardContent>
    </Card>
);


export default function ModelProfilePageClient({ initialModel, publicUrl }: { initialModel: Model | null, publicUrl: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [model, setModel] = useState(initialModel);

  if (!model) { return <div className="text-center py-20"><p>No se encontró el modelo.</p></div>; }

  const handleSubmit: (data: ModelFormData) => Promise<void> = async (data) => {
    setIsSubmitting(true);
    const result = await updateModel(model.id, data);
    if (result.success) {
      toast.success('Perfil actualizado');
      setModel({ ...model, ...data });
      setIsEditing(false);
    } else {
      toast.error('Error al actualizar', { description: result.error });
    }
    setIsSubmitting(false);
  };

  const fallbackText = model.alias?.substring(0, 2) || 'IZ';
  const imageUrl = `${publicUrl}/${model.id}/cover.jpg`;

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-10 w-10 flex-shrink-0" asChild>
            <Link href="/dashboard/models">
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Volver</span>
            </Link>
          </Button>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 hidden sm:flex"><AvatarImage src={imageUrl} alt={model.alias || 'Avatar'} /><AvatarFallback className="text-xl">{fallbackText}</AvatarFallback></Avatar>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{model.alias}</h1>
              <p className="text-muted-foreground">{model.full_name}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSubmitting}>Cancelar</Button>
              <Button form="model-edit-form" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Guardar'}</Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <FilePenLine className="mr-2 h-4 w-4" />
              Editar
            </Button>
          )}
        </div>
      </header>

      <main className="mx-auto w-full space-y-8">
        {isEditing ? (
          <ModelForm model={model} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        ) : (
          <>
            <StaticInfoDisplay model={model} />
            <div className="grid gap-6 lg:grid-cols-2">
              <Card><CardHeader><CardTitle>Gestión de Comp Card</CardTitle><CardDescription>Administra las fotos de la comp card.</CardDescription></CardHeader><CardContent><div className="flex items-center justify-center text-center h-48 rounded-lg border-2 border-dashed"><p className="text-muted-foreground">Próximamente...</p></div></CardContent></Card>
              <Card><CardHeader><CardTitle>Portafolio</CardTitle><CardDescription>Gestiona las imágenes del portafolio.</CardDescription></CardHeader><CardContent><div className="flex items-center justify-center text-center h-48 rounded-lg border-2 border-dashed"><p className="text-muted-foreground">Próximamente...</p></div></CardContent></Card>
            </div>
            <DangerZone modelId={model.id} modelAlias={model.alias || 'este modelo'} />
          </>
        )}
      </main>
    </div>
  );
}

