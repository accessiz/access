import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getModelById } from '@/lib/api/models';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Trash2 } from 'lucide-react';

export default async function ModelProfilePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const model = await getModelById(params.id);

  if (!model) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>No se encontró el modelo.</p>
      </div>
    );
  }

  const { data: publicUrlData } = supabase.storage.from('models').getPublicUrl('');
  const imageUrl = `${publicUrlData.publicUrl}/${model.id}/cover.jpg`;
  const fallbackText = model.alias?.substring(0, 2) || 'IZ';

  return (
    <div className="space-y-6">
      {/* Encabezado del Perfil */}
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={imageUrl} alt={model.alias || 'Avatar'} />
          <AvatarFallback className="text-2xl">{fallbackText}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold">{model.alias}</h1>
          <p className="text-muted-foreground">{model.full_name}</p>
        </div>
      </div>

      {/* Grid de tarjetas */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Columna de Datos */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Información General</CardTitle>
            <CardDescription>Datos y medidas del modelo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>País:</strong> {model.country}</p>
            <p><strong>Altura:</strong> {model.height_cm} cm</p>
            <p><strong>Hombros:</strong> {model.shoulders_cm} cm</p>
            <p><strong>Pecho:</strong> {model.chest_cm} cm</p>
            <p><strong>Cintura:</strong> {model.waist_cm} cm</p>
            <p><strong>Cadera:</strong> {model.hips_cm} cm</p>
            <p><strong>Zapato (EU):</strong> {model.shoe_size_eu}</p>
          </CardContent>
        </Card>

        {/* Columna de Comp Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Gestión de Comp Card</CardTitle>
            <CardDescription>Administra la foto de portada y las 4 fotos de contraportada.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-8">
              Próximamente: Aquí podrás arrastrar y reordenar las fotos, subirlas y eliminarlas.
            </p>
             <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline"><Upload className="h-4 w-4 mr-2" /> Subir Fotos</Button>
                <Button variant="destructive"><Trash2 className="h-4 w-4 mr-2" /> Eliminar</Button>
            </div>
          </CardContent>
        </Card>

        {/* Tarjeta de Portafolio */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Portafolio</CardTitle>
             <CardDescription>Gestiona las imágenes del portafolio del modelo.</CardDescription>
          </CardHeader>
           <CardContent>
            <p className="text-center text-muted-foreground py-8">
              Próximamente: Galería de imágenes del portafolio con opciones de gestión.
            </p>
             <div className="flex justify-end">
                <Button><Upload className="h-4 w-4 mr-2" /> Añadir a Portafolio</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
