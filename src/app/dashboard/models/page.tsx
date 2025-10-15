"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Model } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { toast } from "sonner";
import { ArrowUp, ArrowDown, Download, ExternalLink } from 'lucide-react';

// --- UI Components ---
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from '@/components/ui/skeleton';
import { ModelsToolbar } from '@/components/organisms/ModelsToolbar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { Progress } from "@/components/ui/progress";

// --- CONSTANTES ---
// Usamos un nombre claro para el tamaño de página y lo definimos en un solo lugar.
const PAGE_SIZE = 24;
const BUCKET_NAME = 'Book_Completo_iZ_Management';

// --- Tipos ---
type ModelWithCompletion = Model & { profile_completion?: number };
type SortConfig = { key: keyof Model; direction: 'asc' | 'desc'; };

export default function ModelsPage() {
  const [models, setModels] = useState<ModelWithCompletion[]>([]);
  const [count, setCount] = useState(0);
  const [countries, setCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [publicUrl, setPublicUrl] = useState('');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // --- Estado derivado de la URL ---
  const view = searchParams.get('view') || 'list';
  const currentPage = Number(searchParams.get('page')) || 1;
  const totalPages = Math.ceil(count / PAGE_SIZE);

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: (searchParams.get('sort') as keyof Model) || 'alias',
    direction: (searchParams.get('dir') as 'asc' | 'desc') || 'asc',
  });

  // --- Handlers y Callbacks ---
  const handleSort = useCallback((key: keyof Model) => {
    const params = new URLSearchParams(searchParams);
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    params.set('sort', key);
    params.set('dir', direction);
    // Al ordenar, volvemos a la primera página para evitar confusiones
    params.set('page', '1'); 
    router.replace(`${pathname}?${params.toString()}`);
  }, [searchParams, sortConfig, pathname, router]);

  const handleRowClick = (modelId: string) => router.push(`/dashboard/models/${modelId}`);

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  // --- Efectos ---
  useEffect(() => {
    const supabase = createClient();
    const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl('');
    setPublicUrl(urlData.publicUrl);

    async function fetchCountries() {
        try {
            const { data: countryData, error } = await supabase.from('models').select('country').neq('country', null);
            if (error) throw error;
            setCountries([...new Set(countryData?.map(item => item.country) || [])]);
        } catch (error) {
            console.error("Error fetching countries:", error);
            toast.error("No se pudieron cargar los países.");
        }
    }
    
    if (countries.length === 0) {
      fetchCountries();
    }
  }, [countries.length]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      const sortKey = (searchParams.get('sort') as keyof Model) || 'alias';
      const sortDir = (searchParams.get('dir') as 'asc' | 'desc') || 'asc';
      setSortConfig({ key: sortKey, direction: sortDir });

      // 👇 --- CORRECCIÓN APLICADA ---
      // Construimos los parámetros de la URL incluyendo el límite de ítems por página.
      const params = new URLSearchParams(searchParams);
      params.set('page', currentPage.toString());
      params.set('limit', PAGE_SIZE.toString());
      
      const apiUrl = `/api/models?${params.toString()}`;

      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error('No se pudieron cargar los datos desde la API.');
        }
        const { data, count } = await response.json();
        setModels(data || []);
        setCount(count || 0);
      } catch (error) {
        console.error("Error fetching models via API:", error);
        toast.error("Error al cargar los talentos", {
          description: "Ocurrió un problema de conexión. Por favor, intenta recargar la página."
        });
        setModels([]);
        setCount(0);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [searchParams, currentPage]); // `currentPage` es redundante pero explícito

  // --- Lógica de Paginación para la UI ---
  const paginationItems = useMemo(() => {
    const items: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
    } else {
      items.push(1);
      if (currentPage > 3) items.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) items.push(i);
      if (currentPage < totalPages - 2) items.push('...');
      items.push(totalPages);
    }
    return items;
  }, [currentPage, totalPages]);

  // --- Componentes de Renderizado Internos ---
  const SortableHeader = ({ tkey, label }: { tkey: keyof Model; label: string; }) => (
    <TableHead onClick={() => handleSort(tkey)} className="cursor-pointer hover:text-foreground transition-colors">
      <div className="flex items-center gap-2">
        {label}
        {sortConfig.key === tkey && (
          sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        )}
      </div>
    </TableHead>
  );

  const renderSkeletons = (viewType: string) => {
    const skeletonArray = Array.from({ length: PAGE_SIZE });
    if (viewType === 'grid') {
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {skeletonArray.map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-lg"/>)}
        </div>
      );
    }
    return (
      <div className="space-y-2">
        {skeletonArray.map((_, i) => <Skeleton key={i} className="h-16 w-full"/>)}
      </div>
    );
  };
  
  const renderContent = () => {
    if (loading) {
      return renderSkeletons(view);
    }

    if (models.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center text-center h-full py-20 rounded-lg border border-dashed">
          <p className="text-lg font-semibold">No se encontraron modelos</p>
          <p className="text-muted-foreground">Intenta ajustar los filtros o la búsqueda.</p>
        </div>
      );
    }

    if (view === 'grid') {
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {models.map((model) => (
            <Card key={model.id} onClick={() => handleRowClick(model.id)} className="cursor-pointer hover:border-primary transition-colors group overflow-hidden">
              <div className="aspect-[3/4] relative bg-muted">
                <Avatar className="h-full w-full rounded-none">
                  <AvatarImage src={`${publicUrl}/${model.id}/Portada/cover.jpg`} className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  <AvatarFallback className="rounded-none text-2xl bg-transparent">{model.alias?.substring(0, 2) || 'IZ'}</AvatarFallback>
                </Avatar>
              </div>
              <div className="p-3">
                <p className="font-semibold truncate">{model.alias}</p>
                <p className="text-sm text-muted-foreground">{model.country}</p>
              </div>
            </Card>
          ))}
        </div>
      );
    }

    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader><TableRow>
            <TableHead className="w-[80px]"></TableHead>
            <SortableHeader tkey="alias" label="Alias" />
            <SortableHeader tkey="country" label="País" />
            <SortableHeader tkey="height_cm" label="Estatura" />
            <TableHead>Instagram</TableHead>
            <TableHead>TikTok</TableHead>
            <TableHead>Perfil</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {models.map((model) => (
              <TableRow key={model.id} onClick={() => handleRowClick(model.id)} className="cursor-pointer">
                <TableCell><Avatar><AvatarImage src={`${publicUrl}/${model.id}/Portada/cover.jpg`} /><AvatarFallback>{model.alias?.substring(0, 2) || 'IZ'}</AvatarFallback></Avatar></TableCell>
                <TableCell className="font-medium">{model.alias}</TableCell>
                <TableCell>{model.country}</TableCell>
                <TableCell>{model.height_cm ? `${model.height_cm} cm` : '-'}</TableCell>
                <TableCell>{model.instagram ? <Link href={`https://instagram.com/${model.instagram}`} target="_blank" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 hover:underline text-muted-foreground hover:text-foreground">@{model.instagram} <ExternalLink className="h-3.5 w-3.5" /></Link> : '-'}</TableCell>
                <TableCell>{model.tiktok ? <Link href={`https://tiktok.com/@${model.tiktok}`} target="_blank" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 hover:underline text-muted-foreground hover:text-foreground">@{model.tiktok} <ExternalLink className="h-3.5 w-3.5" /></Link> : '-'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={model.profile_completion || 0} className="w-20 h-1.5" />
                    <span className="text-xs text-muted-foreground">{`${Math.round(model.profile_completion || 0)}%`}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end">
                    <Download className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" onClick={(e) => { e.stopPropagation(); toast.info('Próximamente', { description: 'La descarga de books estará disponible pronto.' }); }} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Talento</h1>
        <p className="text-muted-foreground">Gestiona, filtra y explora la base de datos de modelos.</p>
      </header>
      
      <ModelsToolbar countries={countries} modelCount={count} />

      <div className="pb-6 min-h-[500px]">
        {renderContent()}
      </div>

      {totalPages > 1 && !loading && (
        <footer className="flex justify-between items-center pt-4 w-full">
          <div className="flex-1">
            <Pagination>
              <PaginationContent className="justify-start">
                <PaginationItem>
                  <PaginationPrevious href={createPageURL(currentPage - 1)} className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""} />
                </PaginationItem>
                {paginationItems.map((page, index) => (
                  <PaginationItem key={index}>
                    {page === "..." ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink href={createPageURL(page as number)} isActive={currentPage === page}>
                        {page}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext href={createPageURL(currentPage + 1)} className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
          <div className="text-sm text-muted-foreground whitespace-nowrap ml-4">
            Página {currentPage} de {totalPages}
          </div>
        </footer>
      )}
    </div>
  );
}
