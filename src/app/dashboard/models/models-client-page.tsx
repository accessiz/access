'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Model } from '@/lib/types';
import { toast } from "sonner";
import { fetchSafe } from '@/lib/utils/fetchSafe';
import { ArrowUp, ArrowDown, Download, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from '@/components/ui/skeleton';
import { ModelsToolbar } from '../../../components/organisms/ModelsToolbar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { Progress } from "@/components/ui/progress";

const PAGE_SIZE = 24;

type ModelWithCover = Model & { coverUrl?: string | null };

type SortConfig = { key: keyof Model; direction: 'asc' | 'desc'; };
type InitialData = {
  models: ModelWithCover[];
  count: number;
  countries: string[];
  publicUrl: string;
};

export default function ModelsClientPage({ initialData }: { initialData: InitialData }) {
  const [models, setModels] = useState<ModelWithCover[]>(initialData.models);
  const [count, setCount] = useState(initialData.count);
  const [countries] = useState<string[]>(initialData.countries);
  const [publicUrl] = useState(initialData.publicUrl);
  const [loading, setLoading] = useState(false);

  const isInitialLoad = useRef(true);

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const view = searchParams.get('view') || 'list';
  const currentPage = Number(searchParams.get('page')) || 1;
  const totalPages = Math.ceil(count / PAGE_SIZE);

  const [sortConfig] = useState<SortConfig>({
    key: (searchParams.get('sort') as keyof Model) || 'alias',
    direction: (searchParams.get('dir') as 'asc' | 'desc') || 'asc',
  });

  const handleSort = useCallback((key: keyof Model) => {
    const params = new URLSearchParams(searchParams);
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    params.set('sort', key);
    params.set('dir', direction);
    params.set('page', '1');
    router.replace(`${pathname}?${params.toString()}`);
  }, [searchParams, sortConfig, pathname, router]);

  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    async function fetchData() {
      setLoading(true);

      const params = new URLSearchParams(searchParams);
      params.set('page', currentPage.toString());

      const apiUrl = `/api/models?${params.toString()}`;

      try {
        const res = await fetchSafe<{ data?: any; count?: number }>(apiUrl);
        if (!res.ok) {
          console.error('Error fetching models on client:', res.error);
          toast.error(res.error || 'Error al cargar los talentos');
          setModels([]);
          setCount(0);
        } else {
          const { data, count: newCount } = res.json || {};
          setModels(data || []);
          setCount(newCount || 0);
        }
      } catch (error) {
        console.error("Error fetching models on client:", error);
        toast.error("Error al cargar los talentos");
        setModels([]);
        setCount(0);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [searchParams, currentPage]);

  const handleRowClick = (modelId: string) => router.push(`/dashboard/models/${modelId}`);

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  // ✅ tipo explícito para evitar TS2367
  const paginationItems = useMemo(() => {
    type PageItem = number | '...' | 'skip';
    const items: PageItem[] = [];
    const pagesToShow = 3;
    const halfPages = Math.floor(pagesToShow / 2);

    if (totalPages <= pagesToShow + 2) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
    } else {
      items.push(1);

      if (currentPage > halfPages + 2) items.push('...');

      let startPage = Math.max(2, currentPage - halfPages);
      let endPage = Math.min(totalPages - 1, currentPage + halfPages);

      if (currentPage < halfPages + 2) {
        endPage = Math.min(totalPages - 1, pagesToShow + 1);
      }
      if (currentPage > totalPages - halfPages - 1) {
        startPage = Math.max(2, totalPages - pagesToShow);
      }

      for (let i = startPage; i <= endPage; i++) items.push(i);

      if (currentPage < totalPages - halfPages - 1) items.push('...');

      items.push(totalPages);
    }

    const cleanedItems: PageItem[] = [];
    items.forEach((item, index) => {
      if (item === '...' && items[index - 1] === '...') return;
      else if (item === '...') {
        const prevItem = items[index - 1];
        const nextItem = items[index + 1];
        if (typeof prevItem === 'number' && typeof nextItem === 'number' && nextItem === prevItem + 1) {
          cleanedItems.push(nextItem);
          items[index + 1] = 'skip';
        } else {
          cleanedItems.push(item);
        }
      } else if (item !== 'skip') {
        cleanedItems.push(item);
      }
    });

    return cleanedItems;
  }, [currentPage, totalPages]);

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
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {skeletonArray.map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-lg" />)}
        </div>
      );
    }
    return (
      <div className="space-y-2">
        {skeletonArray.map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  };

  const renderContent = () => {
    if (loading) return renderSkeletons(view);

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
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {models.map((model) => (
            <Card key={model.id} onClick={() => handleRowClick(model.id)} className="cursor-pointer hover:border-primary transition-colors group overflow-hidden">
              <div className="aspect-[3/4] relative bg-muted">
                <Avatar className="h-full w-full rounded-none">
                  <AvatarImage src={model.coverUrl || `${publicUrl}${model.id}/Portada/cover.jpg`} className="object-cover group-hover:scale-105 transition-transform duration-300" />
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
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]"></TableHead>
              <SortableHeader tkey="alias" label="Alias" />
              <SortableHeader tkey="country" label="País" />
              <SortableHeader tkey="height_cm" label="Estatura" />
              <TableHead>Instagram</TableHead>
              <TableHead>TikTok</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {models.map((model) => (
              <TableRow key={model.id} onClick={() => handleRowClick(model.id)} className="cursor-pointer">
                <TableCell><Avatar><AvatarImage src={model.coverUrl || `${publicUrl}${model.id}/Portada/cover.jpg`} /><AvatarFallback>{model.alias?.substring(0, 2) || 'IZ'}</AvatarFallback></Avatar></TableCell>
                <TableCell className="font-medium">{model.alias}</TableCell>
                <TableCell>{model.country}</TableCell>
                <TableCell>{model.height_cm ? `${model.height_cm} cm` : '-'}</TableCell>
                <TableCell>{model.instagram ? <Link href={`https://instagram.com/${model.instagram}`} target="_blank" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 hover:underline text-muted-foreground hover:text-foreground">@{model.instagram} <ExternalLink className="h-3.5 w-3.5" /></Link> : '-'}</TableCell>
                <TableCell>{model.tiktok ? <Link href={`https://tiktok.com/@${model.tiktok}`} target="_blank" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 hover:underline text-muted-foreground hover:text-foreground">@{model.tiktok} <ExternalLink className="h-3.5 w-3.5" /></Link> : '-'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={model.profile_completeness || 0} className="w-20 h-1.5" />
                    <span className="text-xs text-muted-foreground">{`${Math.round(model.profile_completeness || 0)}%`}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end">
                    <Download className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" onClick={(e) => { e.stopPropagation(); toast.info('Próximamente'); }} />
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

      <ModelsToolbar countries={countries} />

      <div className="pb-6 min-h-[500px]">
        {renderContent()}
      </div>

      {totalPages > 1 && !loading && (
        <footer className="flex flex-col items-center gap-4 pt-4 w-full sm:flex-row sm:justify-between">
          <div className="w-full sm:flex-1">
            <Pagination>
              {/* ✅ Centrado en mobile */}
              <PaginationContent className="flex justify-center sm:justify-start w-full">
                <PaginationItem>
                  <PaginationPrevious
                    href={createPageURL(currentPage - 1)}
                    className={cn(
                      currentPage <= 1 ? "pointer-events-none opacity-50" : "",
                      "px-2.5"
                    )}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Anterior</span>
                  </PaginationPrevious>
                </PaginationItem>

                {/* ✅ Oculta los números en mobile */}
                <div className="hidden sm:flex">
                  {paginationItems.map((page, index) => (
                    <PaginationItem key={index}>
                      {page === "..." ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          href={createPageURL(page as number)}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}
                </div>

                <PaginationItem>
                  <PaginationNext
                    href={createPageURL(currentPage + 1)}
                    className={cn(
                      currentPage >= totalPages ? "pointer-events-none opacity-50" : "",
                      "px-2.5"
                    )}
                  >
                    <span className="hidden sm:inline">Siguiente</span>
                    <ChevronRight className="h-4 w-4" />
                  </PaginationNext>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>

          <div className="text-sm text-muted-foreground whitespace-nowrap sm:ml-4">
            Página {currentPage} de {totalPages}
          </div>
        </footer>

      )}
    </div>
  );
}
