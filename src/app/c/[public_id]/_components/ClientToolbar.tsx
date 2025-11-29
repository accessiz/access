'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Search, ListFilter, Ruler, LayoutGrid, List } from 'lucide-react';
import { useMemo } from 'react';
import { useDebouncedCallback } from 'use-debounce';

const heightRanges = [
  { label: "Cualquier Estatura", min: null, max: null },
  { label: "Menos de 170 cm", min: null, max: 169 },
  { label: "170 - 175 cm", min: 170, max: 175 },
  { label: "176 - 180 cm", min: 176, max: 180 },
  { label: "181 - 185 cm", min: 181, max: 185 },
  { label: "Más de 185 cm", min: 186, max: null },
];

interface ClientToolbarProps {
    countries: string[];
    onFilterChange: (filters: { key: string; value: string | null }) => void;
    onViewChange: (view: 'list' | 'grid') => void;
    currentFilters: { 
        query: string;
        country: string | null; 
        minHeight: number | null; 
        maxHeight: number | null; 
        view: 'list' | 'grid' 
    };
}

export function ClientToolbar({ countries, onFilterChange, onViewChange, currentFilters }: ClientToolbarProps) {

  const handleSearch = useDebouncedCallback((term: string) => {
    onFilterChange({ key: 'query', value: term });
  }, 300);

  const handleFilterByHeight = (min: number | null, max: number | null) => {
    onFilterChange({ key: 'minHeight', value: min !== null ? String(min) : null });
    onFilterChange({ key: 'maxHeight', value: max !== null ? String(max) : null });
  };

  const currentHeightLabel = useMemo(() =>
      heightRanges.find(range => 
        range.min === currentFilters.minHeight && 
        range.max === currentFilters.maxHeight
      )?.label || 'Estatura',
  [currentFilters.minHeight, currentFilters.maxHeight]);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex w-full sm:w-auto items-center gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
        {/* Campo de Búsqueda */}
        <div className="relative flex-1 min-w-[200px] sm:flex-initial sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar nombre o alias..."
            className="pl-9"
            onChange={(e) => handleSearch(e.target.value)}
            defaultValue={currentFilters.query}
          />
        </div>
        
        {/* Filtro por País */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="flex-shrink-0">
              <ListFilter className="h-4 w-4" />
              <span className="sr-only">{currentFilters.country || 'País'}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Filtrar por país</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onFilterChange({ key: 'country', value: null })}>Todos</DropdownMenuItem>
            {countries.map((c) => (
                <DropdownMenuItem 
                    key={c} 
                    onSelect={() => onFilterChange({ key: 'country', value: c })}
                    className={currentFilters.country === c ? "bg-accent text-accent-foreground" : ""}
                >
                    {c}
                </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Filtro por Estatura */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="flex-shrink-0">
              <Ruler className="h-4 w-4" />
              <span className="sr-only">{currentHeightLabel}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Filtrar por estatura</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {heightRanges.map((r) => (
                <DropdownMenuItem 
                    key={r.label} 
                    onSelect={() => handleFilterByHeight(r.min, r.max)}
                    className={r.min === currentFilters.minHeight && r.max === currentFilters.maxHeight ? "bg-accent text-accent-foreground" : ""}
                >
                    {r.label}
                </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Selector de Vista (Grid/List) */}
      <div className="flex w-full sm:w-auto items-center gap-2">
        <div className="flex items-center rounded-md border bg-background p-0.5 ml-auto sm:ml-0">
          <Button variant={currentFilters.view === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => onViewChange('list')} className="h-8 w-8"><List className="h-4 w-4" /></Button>
          <Button variant={currentFilters.view === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => onViewChange('grid')} className="h-8 w-8"><LayoutGrid className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}