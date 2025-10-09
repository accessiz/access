import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
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
  searchParams?: { q?: string; country?: string; };
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

  // Construimos la consulta de forma dinámica
  let query = supabase
    .from('models')
    .select('*', { count: 'exact' });

  if (searchQuery) {
    query = query.ilike('alias', `%${searchQuery}%`);
  }

  if (countryQuery) {
    query = query.eq('country', countryQuery);
  }

  const { data: models, error, count } = await query.order('alias', { ascending: true });

  // Obtenemos la lista de países únicos para poblar el filtro
  const { data: countriesData } = await supabase
    .from('models')
    .select('country')
    .neq('country', null);
  
  const uniqueCountries = [...new Set(countriesData?.map(item => item.country) || [])].sort();

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
              models.map((model: any) => {
                const imageUrl = `${publicUrlData.publicUrl}/${model.id}/cover.jpg`;
                const fallbackText = model.alias?.substring(0, 2) || 'IZ';

                return (
                  <TableRow key={model.id}>
                    <TableCell>
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={imageUrl} alt={model.alias} />
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
            {/* --- LA CORRECCIÓN ESTÁ AQUÍ --- */}
            {/* Usamos un ternario para asegurar que no se renderice nada si no hay error */}
            {error ? (
               <TableRow>
                <TableCell colSpan={5} className="text-center text-destructive">
                  Error al cargar los modelos: {error.message}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

