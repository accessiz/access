
'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Model } from '@/lib/types';
import { ModelFormData } from '@/lib/schemas';
import { updateModel } from '@/lib/actions/models';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Trash2, FilePenLine, X, Save } from 'lucide-react';
import { DeleteModelDialog } from '@/components/organisms/DeleteModelDialog';
import { ModelForm } from '@/components/organisms/ModelForm';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

const StaticInfoDisplay = ({ model }: { model: Model }) => (
  <div className="space-y-8">
    <div className="space-y-2"><h3 className="font-semibold">Detalles Personales</h3><div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 text-sm"><div><p className="text-muted-foreground">País</p><p>{model.country || 'N/A'}</p></div><div><p className="text-muted-foreground">Fecha de Nacimiento</p><p>{model.birth_date || 'N/A'}</p></div><div><p className="text-muted-foreground">Género</p><p className="capitalize">{model.gender || 'N/A'}</p></div></div></div>
    <div className="space-y-2"><h3 className="font-semibold">Medidas</h3><div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 text-sm"><div><p className="text-muted-foreground">Estatura</p><p>{model.height_cm ? `${model.height_cm} cm` : 'N/A'}</p></div><div><p className="text-muted-foreground">Hombros</p><p>{model.shoulders_cm ? `${model.shoulders_cm} cm` : 'N/A'}</p></div><div><p className="text-muted-foreground">Pecho/Busto</p><p>{model.chest_cm || model.bust_cm ? `${model.chest_cm || model.bust_cm} cm` : 'N/A'}</p></div><div><p className="text-muted-foreground">Cintura</p><p>{model.waist_cm ? `${model.waist_cm} cm` : 'N/A'}</p></div><div><p className="text-muted-foreground">Cadera</p><p>{model.hips_cm ? `${model.hips_cm} cm` : 'N/A'}</p></div></div></div>
    <div className="space-y-2"><h3 className="font-semibold">Tallas</h3><div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 text-sm"><div><p className="text-muted-foreground">Talla Superior</p><p>{model.top_size || 'N/A'}</p></div><div><p className="text-muted-foreground">Pantalón</p><p>{model.pants_size || 'N/A'}</p></div><div><p className="text-muted-foreground">Zapato (EU)</p><p>{model.shoe_size_eu || 'N/A'}</p></div></div></div>
  </div>
);

export default function ModelProfilePageClient({ initialModel, publicUrl }: { initialModel: Model | null, publicUrl: string }) {
  const router = useRouter();
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
      router.refresh();
    } else {
      toast.error('Error al actualizar', { description: result.error });
    }
    setIsSubmitting(false);
  };

  const fallbackText = model.alias?.substring(0, 2) || 'IZ';
  const imageUrl = `${publicUrl}/${model.id}/cover.jpg`;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-8 w-8" asChild><Link href="/dashboard/models"><ChevronLeft className="h-4 w-4" /></Link></Button>
          <Avatar className="h-16 w-16"><AvatarImage src={imageUrl} alt={model.alias || 'Avatar'} /><AvatarFallback className="text-xl">{fallbackText}</AvatarFallback></Avatar>
          <div><h1 className="text-2xl font-bold">{model.alias}</h1><p className="text-sm text-muted-foreground">{model.full_name}</p></div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSubmitting}>Cancelar</Button>
              <Button form="model-edit-form" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Guardar'}</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)}>Editar</Button>
              <DeleteModelDialog modelId={model.id} modelAlias={model.alias || 'este modelo'}><Button variant="destructive">Eliminar</Button></DeleteModelDialog>
            </>
          )}
        </div>
      </header>
      <div className="mx-auto max-w-5xl space-y-8">
        {isEditing ? (
          <ModelForm model={model} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        ) : (
          <>
            <Card><CardHeader><CardTitle>Información General</CardTitle></CardHeader><CardContent><StaticInfoDisplay model={model} /></CardContent></Card>
            <div className="grid gap-6 lg:grid-cols-2">
              <Card><CardHeader><CardTitle>Gestión de Comp Card</CardTitle></CardHeader><CardContent><div className="flex items-center justify-center text-center h-48 rounded-lg border-2 border-dashed"><p className="text-muted-foreground">Próximamente...</p></div><div className="flex justify-end gap-2 mt-4"><Button variant="outline" disabled>Subir Fotos</Button></div></CardContent></Card>
              <Card><CardHeader><CardTitle>Portafolio</CardTitle></CardHeader><CardContent><div className="flex items-center justify-center text-center h-48 rounded-lg border-2 border-dashed"><p className="text-muted-foreground">Próximamente...</p></div><div className="flex justify-end mt-4"><Button disabled>Añadir a Portafolio</Button></div></CardContent></Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
