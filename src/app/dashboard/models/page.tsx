import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getModels, getUniqueCountries } from '@/lib/api/models';
import { Model } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress"; // Importado de shadcn
import { PlusCircle, ExternalLink } from 'lucide-react';
import { ModelsToolbar } from '@/components/organisms/ModelsToolbar';
import Link from 'next/link';

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
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { q, country, minHeight, maxHeight } = searchParams || {};

  const [uniqueCountries, { data: modelsData, count }] = await Promise.all([
    getUniqueCountries(),
    getModels({ query: q, country, minHeight, maxHeight }),
  ]);

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
              <TableHead className="hidden lg:table-cell">Instagram</TableHead>
              <TableHead className="hidden md:table-cell">TikTok</TableHead>
              <TableHead>Perfil</TableHead>
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
                    <TableCell className="hidden lg:table-cell">
                      {model.instagram || '-'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {model.tiktok ? (
                        <Link href={`https://tiktok.com/@${model.tiktok}`} target="_blank" className="flex items-center gap-1 hover:underline">
                          @{model.tiktok} <ExternalLink className="h-3 w-3" />
                        </Link>
                      ) : '-'}
                    </TableCell>
                     <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-mono">
                          {model.profile_completion || 0}%
                        </span>
                        <Progress value={model.profile_completion || 0} className="w-[80px]" />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No se encontraron modelos para los filtros aplicados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
