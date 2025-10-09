import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
// Importamos la lógica de fetching y los tipos
import { getModels, getUniqueCountries } from '@/lib/api/models';
import { Model } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlusCircle } from 'lucide-react';
import { ModelsToolbar } from '@/components/organisms/ModelsToolbar';

export default async function ModelsPage({
  searchParams,
}: {
  searchParams?: { 
    q?: string; 
    country?: string;
    minHeight?: string;
    maxHeight?: string;
  };
}) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const searchQuery = searchParams?.q || '';
  const countryQuery = searchParams?.country || '';
  const minHeightQuery = searchParams?.minHeight || '';
  const maxHeightQuery = searchParams?.maxHeight || '';

  // Usamos las nuevas funciones para obtener los datos en paralelo
  const [uniqueCountries, { data: modelsData, count }] = await Promise.all([
    getUniqueCountries(),
    getModels({
      query: searchQuery,
      country: countryQuery,
      minHeight: minHeightQuery,
      maxHeight: maxHeightQuery,
    }),
  ]);

  // Hacemos un type assertion para asegurar a TypeScript que los datos son del tipo Model[]
  const models = modelsData as Model[] | null;

  const { data: publicUrlData } = supabase.storage.from('models').getPublicUrl('');

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-col gap-4">
        <div className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Talento</CardTitle>
              <CardDescription>
                Mostrando {models?.length ?? 0} de {count ?? 0} modelos.
              </CardDescription>
            </div>
            <Button size="sm" className="gap-1">
                <PlusCircle className="h-4 w-4" />
                Añadir Talento
            </Button>
        </div>
        <ModelsToolbar countries={uniqueCountries} />
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-card">
            <TableRow>
              <TableHead className="w-[64px]"></TableHead>
              <TableHead>Alias</TableHead>
              <TableHead>País</TableHead>
              <TableHead>Altura</TableHead>
              <TableHead className="hidden md:table-cell">Instagram</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {models && models.length > 0 ? (
              models.map((model) => {
                const imageUrl = `${publicUrlData.publicUrl}/${model.id}/cover.jpg`;
                const fallbackText = model.alias?.substring(0, 2) || 'IZ';

                return (
                  <TableRow key={model.id}>
                    <TableCell>
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={imageUrl} alt={model.alias || 'Avatar'} />
                        <AvatarFallback>{fallbackText}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{model.alias}</TableCell>
                    <TableCell>{model.country}</TableCell>
                    <TableCell>{model.height_cm ? `${model.height_cm} cm` : '-'}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {model.instagram}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No se encontraron modelos para los filtros aplicados.
                </TableCell>
              </TableRow>
            )}
            {/* El manejo de errores ahora está dentro de getModels, 
                así que un `error.tsx` en esta ruta lo capturaría.
                Ya no necesitamos renderizar el error aquí. */}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
