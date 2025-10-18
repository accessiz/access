"use client";

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Search, ListFilter, Ruler, LayoutGrid, List, PlusCircle } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';
import { useMemo } from 'react';

const heightRanges = [
  { label: "Cualquier Estatura", min: null, max: null },
  { label: "Menos de 170 cm", min: null, max: 169 },
  { label: "170 - 175 cm", min: 170, max: 175 },
  { label: "176 - 180 cm", min: 176, max: 180 },
  { label: "181 - 185 cm", min: 181, max: 185 },
  { label: "Más de 185 cm", min: 186, max: null },
];

export function ModelsToolbar({ countries }: { countries: string[] }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const view = searchParams.get('view') || 'list';
  const currentCountry = searchParams.get('country');
  const currentMinHeight = searchParams.get('minHeight');
  const currentMaxHeight = searchParams.get('maxHeight');

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', '1');
    if (term) params.set('q', term); else params.delete('q');
    router.replace(`${pathname}?${params.toString()}`);
  }, 300);

  const handleFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', '1');
    if (value) params.set(key, value); else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleFilterByHeight = (min: number | null, max: number | null) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', '1');
    if (min !== null) params.set('minHeight', String(min)); else params.delete('minHeight');
    if (max !== null) params.set('maxHeight', String(max)); else params.delete('maxHeight');
    router.replace(`${pathname}?${params.toString()}`);
  };

  const setView = (newView: 'list' | 'grid') => {
    const params = new URLSearchParams(searchParams);
    params.set('view', newView);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const currentHeightLabel = useMemo(() =>
      heightRanges.find(range => 
        String(range.min) === (currentMinHeight || 'null') && 
        String(range.max) === (currentMaxHeight || 'null')
      )?.label || 'Estatura',
  [currentMinHeight, currentMaxHeight]);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex w-full sm:w-auto items-center gap-2">
        <div className="relative flex-1 sm:flex-initial sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nombre o alias..."
            className="pl-9"
            onChange={(e) => handleSearch(e.target.value)}
            defaultValue={searchParams.get('q')?.toString()}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-10 gap-1.5">
              <ListFilter className="h-4 w-4" />
              <span className="hidden sm:inline">{currentCountry || 'País'}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filtrar por país</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => handleFilter('country', null)}>Todos</DropdownMenuItem>
            {countries.map((c) => <DropdownMenuItem key={c} onSelect={() => handleFilter('country', c)}>{c}</DropdownMenuItem>)}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-10 gap-1.5">
              <Ruler className="h-4 w-4" />
              <span className="hidden sm:inline">{currentHeightLabel.split(' ')[0]}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filtrar por estatura</DropdownMenuLabel>
             <DropdownMenuSeparator />
            {heightRanges.map((r) => <DropdownMenuItem key={r.label} onSelect={() => handleFilterByHeight(r.min, r.max)}>{r.label}</DropdownMenuItem>)}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex w-full sm:w-auto items-center gap-2">
        <div className="flex items-center rounded-md border bg-background p-0.5">
          <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('list')} className="h-8 w-8"><List className="h-4 w-4" /></Button>
          <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('grid')} className="h-8 w-8"><LayoutGrid className="h-4 w-4" /></Button>
        </div>
        <Button size="sm" className="h-10 gap-2 w-full sm:w-auto" asChild>
            <Link href="/dashboard/models/new">
                <PlusCircle className="h-4 w-4" />
                Añadir Talento
            </Link>
        </Button>
      </div>
    </div>
  );
}
