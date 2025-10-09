"use client"; // Convertido a Client Component para usar el hook useRouter

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client'; // Usamos el cliente de navegador
import { Model } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { PlusCircle, ExternalLink, Download } from 'lucide-react';
import { ModelsToolbar } from '@/components/organisms/ModelsToolbar';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

// Este componente ahora manejará el estado de carga y los datos
export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [count, setCount] = useState(0);
  const [countries, setCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [publicUrl, setPublicUrl] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const supabase = createClient();
    const { data: urlData } = supabase.storage.from('models').getPublicUrl('');
    setPublicUrl(urlData.publicUrl);

    async function fetchData() {
      setLoading(true);
      // La lógica de fetch ahora se hace en el cliente
      const query = searchParams.get('q') || '';
      const country = searchParams.get('country') || '';
      const minHeight = searchParams.get('minHeight') || '';
      const maxHeight = searchParams.get('maxHeight') || '';

      // Construimos la query
      let supabaseQuery = supabase.from('models').select('*', { count: 'exact' });
      if (query) supabaseQuery = supabaseQuery.ilike('alias', `%${query}%`);
      if (country) supabaseQuery = supabaseQuery.eq('country', country);
      if (minHeight) supabaseQuery = supabaseQuery.gte('height_cm', Number(minHeight));
      if (maxHeight) supabaseQuery = supabaseQuery.lte('height_cm', Number(maxHeight));

      const { data: fetchedModels, error, count } = await supabaseQuery.order('alias', { ascending: true });

      if (error) {
        console.error(error);
      } else if (fetchedModels) {
         // Enriquecemos los modelos (esta lógica se podría mover a una edge function en el futuro para optimizar)
         const enrichedModels = await Promise.all(
            fetchedModels.map(async (model) => {
                const { data: files } = await supabase.storage.from('models').list(model.id, { limit: 100, recursive: true });
                // Aquí re-usamos una versión simplificada de la lógica de completitud
                const completion = 50; // Placeholder
                return { ...model, profile_completion: completion };
            })
         );
        setModels(enrichedModels as Model[]);
        setCount(count || 0);
      }

      const { data: countryData } = await supabase.from('models').select('country').neq('country', null);
      setCountries([...new Set(countryData?.map(item => item.country) || [])]);

      setLoading(false);
    }

    fetchData();
  }, [searchParams]);

  const handleRowClick = (modelId: string) => {
    router.push(`/dashboard/models/${modelId}`);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-col gap-4">
        <div className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Talento</CardTitle>
            <CardDescription>
              {loading ? 'Cargando...' : `Mostrando ${models.length} de ${count} modelos.`}
            </CardDescription>
          </div>
          <Button size="sm" className="gap-1">
            <PlusCircle className="h-4 w-4" />
            Añadir Talento
          </Button>
        </div>
        <ModelsToolbar countries={countries} />
      </CardHeader>
      {/* Contenedor de la tabla con scroll */}
      <CardContent className="flex-1 overflow-y-auto">
        <Table>
          {/* Encabezado fijo */}
          <TableHeader className="sticky top-0 bg-card z-10">
            <TableRow>
              <TableHead className="w-[64px]"></TableHead>
              <TableHead>Alias</TableHead>
              <TableHead>País</TableHead>
              <TableHead>Instagram</TableHead>
              <TableHead>TikTok</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                Array.from({ length: 8 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                  </TableRow>
                ))
            ) : models.length > 0 ? (
              models.map((model) => {
                const imageUrl = `${publicUrl}/${model.id}/cover.jpg`;
                const fallbackText = model.alias?.substring(0, 2) || 'IZ';

                return (
                  <TableRow key={model.id} onClick={() => handleRowClick(model.id)} className="cursor-pointer">
                    <TableCell><Avatar><AvatarImage src={imageUrl} /><AvatarFallback>{fallbackText}</AvatarFallback></Avatar></TableCell>
                    <TableCell className="font-medium">{model.alias}</TableCell>
                    <TableCell>{model.country}</TableCell>
                    <TableCell>
                      {model.instagram ? (
                        <Link href={`https://instagram.com/${model.instagram}`} target="_blank" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 hover:underline">
                          @{model.instagram} <ExternalLink className="h-3 w-3" />
                        </Link>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {model.tiktok ? (
                        <Link href={`https://tiktok.com/@${model.tiktok}`} target="_blank" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 hover:underline">
                          @{model.tiktok} <ExternalLink className="h-3 w-3" />
                        </Link>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-mono">{model.profile_completion || 0}%</span>
                        <Progress value={model.profile_completion || 0} className="w-[80px]" />
                      </div>
                    </TableCell>
                    <TableCell>
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); alert('Próximamente: Descargar Comp Card'); }}>
                            <Download className="h-3 w-3 mr-1" />
                            Comp Card
                        </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow><TableCell colSpan={7} className="h-24 text-center">No se encontraron modelos.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
