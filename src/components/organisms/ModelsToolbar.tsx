"use client";

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, ListFilter, Ruler } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';

// Definimos los rangos de estatura para el filtro
const heightRanges = [
  { label: "Todos", min: null, max: null },
  { label: "Menos de 170 cm", min: null, max: 169 },
  { label: "170 - 175 cm", min: 170, max: 175 },
  { label: "176 - 180 cm", min: 176, max: 180 },
  { label: "181 - 185 cm", min: 181, max: 185 },
  { label: "Más de 185 cm", min: 186, max: null },
];

// El componente ahora recibe la lista de países como una propiedad
export function ModelsToolbar({ countries }: { countries: string[] }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set('q', term);
    } else {
      params.delete('q');
    }
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  const handleFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    replace(`${pathname}?${params.toString()}`);
  };

  const handleFilterByHeight = (min: number | null, max: number | null) => {
    const params = new URLSearchParams(searchParams);
    if (min !== null) {
      params.set('minHeight', String(min));
    } else {
      params.delete('minHeight');
    }
    if (max !== null) {
      params.set('maxHeight', String(max));
    } else {
      params.delete('maxHeight');
    }
    replace(`${pathname}?${params.toString()}`);
  };

  const currentCountry = searchParams.get('country');
  const currentMinHeight = searchParams.get('minHeight');
  const currentMaxHeight = searchParams.get('maxHeight');

  const currentHeightLabel = 
    heightRanges.find(range => 
      String(range.min) === (currentMinHeight || 'null') && 
      String(range.max) === (currentMaxHeight || 'null')
    )?.label || 'Filtrar Estatura';

  return (
    <div className="flex items-center gap-2 md:gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar por alias..."
          className="pl-9 w-full md:w-auto"
          onChange={(e) => handleSearch(e.target.value)}
          defaultValue={searchParams.get('q')?.toString()}
        />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-10 gap-1">
            <ListFilter className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              {currentCountry || 'Filtrar País'}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Filtrar por país</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => handleFilter('country', null)}>
            Todos los países
          </DropdownMenuItem>
          {countries.map((country) => (
             <DropdownMenuItem key={country} onSelect={() => handleFilter('country', country)}>
              {country}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Nuevo Dropdown para el filtro de estatura */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-10 gap-1">
            <Ruler className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              {currentHeightLabel}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Filtrar por estatura</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {heightRanges.map((range) => (
            <DropdownMenuItem
              key={range.label}
              onSelect={() => handleFilterByHeight(range.min, range.max)}
            >
              {range.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
