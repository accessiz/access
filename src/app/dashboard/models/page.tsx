
"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Model } from '@/lib/types';
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from '@/components/ui/skeleton';
import { ModelsToolbar } from '@/components/organisms/ModelsToolbar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import Link from 'next/link';
import { ArrowUp, ArrowDown, Download, ExternalLink } from 'lucide-react';

const ITEMS_PER_PAGE = 24;

type SortConfig = {
  key: keyof Model;
  direction: 'asc' | 'desc';
};

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [count, setCount] = useState(0);
  const [countries, setCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [publicUrl, setPublicUrl] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const view = searchParams.get('view') || 'list';
  const currentPage = Number(searchParams.get('page')) || 1;
  const totalPages = Math.ceil(count / ITEMS_PER_PAGE);

  const [sortConfig, setSortConfig] = useState<SortConfig>({
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
    router.replace(`${pathname}?${params.toString()}`);
  }, [searchParams, sortConfig, pathname, router]);


  useEffect(() => {
    const supabase = createClient();
    const { data: urlData } = supabase.storage.from('models').getPublicUrl('');
    setPublicUrl(urlData.publicUrl);

    async function fetchData() {
      setLoading(true);
      const query = searchParams.get('q') || '';
      const country = searchParams.get('country') || '';
      const minHeight = searchParams.get('minHeight') || '';
      const maxHeight = searchParams.get('maxHeight') || '';

      // Update sortConfig from URL params on fetch
      const sortKey = (searchParams.get('sort') as keyof Model) || 'alias';
      const sortDir = (searchParams.get('dir') as 'asc' | 'desc') || 'asc';
      setSortConfig({ key: sortKey, direction: sortDir });

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let supabaseQuery = supabase.from('models').select('*', { count: 'exact' });
      if (query) supabaseQuery = supabaseQuery.or(`full_name.ilike.%${query}%,alias.ilike.%${query}%`);
      if (country) supabaseQuery = supabaseQuery.eq('country', country);
      if (minHeight) supabaseQuery = supabaseQuery.gte('height_cm', Number(minHeight));
      if (maxHeight) supabaseQuery = supabaseQuery.lte('height_cm', Number(maxHeight));

      const { data: fetchedModels, error, count } = await supabaseQuery
        .order(sortKey, { ascending: sortDir === 'asc' })
        .range(from, to);

      if (error) {
        console.error("Error fetching models:", error);
      } else {
        setModels((fetchedModels as Model[]) || []);
        setCount(count || 0);
      }

      if (countries.length === 0) {
        const { data: countryData } = await supabase.from('models').select('country').neq('country', null);
        setCountries([...new Set(countryData?.map(item => item.country) || [])]);
      }
      setLoading(false);
    }
    fetchData();
  }, [searchParams, currentPage, countries.length]);

  const handleRowClick = (modelId: string) => {
    router.push(`/dashboard/models/${modelId}`);
  };

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

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

  return (
    <div className="h-full flex flex-col bg-background space-y-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Talento</h1>
            <p className="text-muted-foreground">Gestiona, filtra y explora la base de datos de modelos.</p>
        </div>

        <ModelsToolbar countries={countries} modelCount={count} />

        <div className="flex-1">
          {loading ? (
              view === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-lg"/>)}
                </div>
              ) : (
                <div className="space-y-2">
                  {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => <Skeleton key={i} className="h-16 w-full"/>)}
                </div>
              )
          ) : models.length > 0 ? (
            view === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {models.map((model) => {
                  const imageUrl = `${publicUrl}/${model.id}/cover.jpg`;
                  return (
                    <Card key={model.id} onClick={() => handleRowClick(model.id)} className="cursor-pointer hover:border-primary transition-colors group overflow-hidden">
                      <div className="aspect-[3/4] relative bg-muted">
                        <Avatar className="h-full w-full rounded-none">
                          <AvatarImage src={imageUrl} className="object-cover group-hover:scale-105 transition-transform duration-300" />
                          <AvatarFallback className="rounded-none text-2xl bg-transparent">{model.alias?.substring(0, 2) || 'IZ'}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="p-3">
                        <p className="font-semibold truncate">{model.alias}</p>
                        <p className="text-sm text-muted-foreground">{model.country}</p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]"></TableHead>
                      <SortableHeader tkey="alias" label="Alias" />
                      <SortableHeader tkey="country" label="País" />
                      <SortableHeader tkey="height_cm" label="Estatura" />
                      <TableHead>Instagram</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {models.map((model) => (
                      <TableRow key={model.id} onClick={() => handleRowClick(model.id)} className="cursor-pointer">
                        <TableCell>
                          <Avatar>
                            <AvatarImage src={`${publicUrl}/${model.id}/cover.jpg`} />
                            <AvatarFallback>{model.alias?.substring(0, 2) || 'IZ'}</AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">{model.alias}</TableCell>
                        <TableCell>{model.country}</TableCell>
                        <TableCell>{model.height_cm} cm</TableCell>
                        <TableCell>
                          {model.instagram && (
                            <Link href={`https://instagram.com/${model.instagram}`} target="_blank" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 hover:underline text-muted-foreground hover:text-foreground">
                              @{model.instagram} <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                           <Download className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" onClick={(e) => { e.stopPropagation(); alert('Próximamente'); }} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center text-center h-full py-20 rounded-lg border border-dashed">
              <p className="text-lg font-semibold">No se encontraron modelos</p>
              <p className="text-muted-foreground">Intenta ajustar los filtros o la búsqueda.</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <footer className="flex items-center justify-between py-6">
            {/* Contenedor del slider con control local de alineación */}
            <div className="flex justify-start w-full max-w-[300px]">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href={createPageURL(currentPage - 1)}
                      className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  {paginationItems.map((page, index) => (
                    <PaginationItem key={index}>
                      {page === '...' ? (
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
                  <PaginationItem>
                    <PaginationNext
                      href={createPageURL(currentPage + 1)}
                      className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>

            {/* Texto de página actual */}
            <div className="text-xs text-muted-foreground">
              Página {currentPage} de {totalPages}
            </div>
          </footer>
        )}


    </div>
  );
}
